import type { IncomingMessage, ServerResponse } from "node:http";
import type { Octokit } from "@octokit/rest";
import type { Environment } from "../config/env.js";
import type { DeliveryCache } from "../infrastructure/deliveryCache.js";
import { verifyWebhook } from "../infrastructure/github/webhook.js";
import type { Logger } from "../observability/logger.js";
import type { Metrics } from "../observability/metrics.js";
import type { DispatchResult } from "../webhooks/dispatcher.js";
import { installationId } from "../webhooks/events.js";

export interface InstallationAuth {
  installationClient(installationId: number): Promise<Octokit>;
}

export interface ApplicationDependencies {
  env: Environment;
  auth: InstallationAuth;
  dispatch(octokit: Octokit, event: string, payload: unknown): Promise<DispatchResult>;
  deliveries: DeliveryCache;
  logger: Logger;
  metrics: Metrics;
  isReady(): boolean;
}

class PayloadTooLargeError extends Error {}

export function createRequestHandler(dependencies: ApplicationDependencies) {
  return async function handleRequest(
    request: IncomingMessage,
    response: ServerResponse,
  ): Promise<void> {
    applySecurityHeaders(response);
    dependencies.metrics.increment("github_cla_http_requests_total", {
      method: request.method ?? "UNKNOWN",
      path: request.url ?? "unknown",
    });

    try {
      await routeRequest(request, response, dependencies);
    } catch (error: unknown) {
      if (error instanceof PayloadTooLargeError) {
        send(response, 413, "payload too large");
        return;
      }
      dependencies.logger.error("unhandled request error", { error: errorMessage(error) });
      send(response, 500, "internal error");
    }
  };
}

async function routeRequest(
  request: IncomingMessage,
  response: ServerResponse,
  dependencies: ApplicationDependencies,
): Promise<void> {
  if (request.method === "GET" && (request.url === "/health" || request.url === "/health/live")) {
    sendJson(response, 200, { status: "ok" });
    return;
  }

  if (request.method === "GET" && request.url === "/health/ready") {
    const ready = dependencies.isReady();
    sendJson(response, ready ? 200 : 503, { status: ready ? "ready" : "not_ready" });
    return;
  }

  if (request.method === "GET" && request.url === "/metrics" && dependencies.env.ENABLE_METRICS) {
    response.writeHead(200, { "content-type": "text/plain; version=0.0.4; charset=utf-8" });
    response.end(dependencies.metrics.toPrometheus());
    return;
  }

  if (request.method !== "POST" || request.url !== "/webhooks/github") {
    send(response, 404, "not found");
    return;
  }

  const body = await readBody(request, dependencies.env.MAX_WEBHOOK_BYTES);
  const signature = singleHeader(request.headers["x-hub-signature-256"]);
  if (!verifyWebhook(body, signature, dependencies.env.WEBHOOK_SECRET)) {
    dependencies.metrics.increment("github_cla_webhook_signature_failures_total");
    send(response, 401, "invalid signature");
    return;
  }

  const event = singleHeader(request.headers["x-github-event"]);
  const delivery = singleHeader(request.headers["x-github-delivery"]);
  if (!event || !delivery) {
    send(response, 400, "missing GitHub webhook headers");
    return;
  }

  if (dependencies.deliveries.has(delivery)) {
    dependencies.metrics.recordWebhook(event, "duplicate");
    dependencies.logger.info("duplicate webhook ignored", { delivery, event });
    send(response, 202, "duplicate");
    return;
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body.toString("utf8"));
  } catch {
    send(response, 400, "invalid json");
    return;
  }

  const installation = installationId(payload);
  if (!installation) {
    send(response, 400, "missing installation id");
    return;
  }

  const startedAt = Date.now();
  try {
    const octokit = await dependencies.auth.installationClient(installation);
    const result = await dependencies.dispatch(octokit, event, payload);
    if (result !== "invalid") dependencies.deliveries.add(delivery);
    dependencies.metrics.recordWebhook(event, result);
    dependencies.logger.info("webhook processed", {
      delivery,
      event,
      installation,
      result,
      durationMs: Date.now() - startedAt,
    });

    if (result === "invalid") {
      send(response, 422, "unsupported payload shape");
      return;
    }
    send(response, 202, result);
  } catch (error: unknown) {
    dependencies.metrics.recordWebhook(event, "error");
    dependencies.logger.error("webhook processing failed", {
      delivery,
      event,
      installation,
      durationMs: Date.now() - startedAt,
      error: errorMessage(error),
    });
    throw error;
  }
}

async function readBody(request: IncomingMessage, maximumBytes: number): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > maximumBytes) throw new PayloadTooLargeError();
    chunks.push(buffer);
  }
  return Buffer.concat(chunks);
}

function singleHeader(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function applySecurityHeaders(response: ServerResponse): void {
  response.setHeader("cache-control", "no-store");
  response.setHeader("content-security-policy", "default-src 'none'");
  response.setHeader("x-content-type-options", "nosniff");
  response.setHeader("x-frame-options", "DENY");
  response.setHeader("referrer-policy", "no-referrer");
}

function send(response: ServerResponse, status: number, body: string): void {
  response.writeHead(status, { "content-type": "text/plain; charset=utf-8" });
  response.end(body);
}

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
