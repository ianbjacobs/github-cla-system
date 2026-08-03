import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { loadEnvironment } from "./config/env.js";
import { GitHubAuth } from "./infrastructure/github/auth.js";
import { verifyWebhook } from "./infrastructure/github/webhook.js";
import { dispatchWebhook } from "./webhooks/dispatcher.js";
import { installationId } from "./webhooks/events.js";

const MAX_WEBHOOK_BYTES = 1024 * 1024;
const env = await loadEnvironment();
const auth = new GitHubAuth(env);

const server = createServer(async (request, response) => {
  try {
    await handleRequest(request, response);
  } catch (error: unknown) {
    console.error("Unhandled request error", error);
    send(response, 500, "internal error");
  }
});

async function handleRequest(request: IncomingMessage, response: ServerResponse): Promise<void> {
  if (request.method === "GET" && request.url === "/health") {
    sendJson(response, 200, { status: "ok" });
    return;
  }

  if (request.method !== "POST" || request.url !== "/webhooks/github") {
    send(response, 404, "not found");
    return;
  }

  const body = await readBody(request, MAX_WEBHOOK_BYTES);
  const signature = singleHeader(request.headers["x-hub-signature-256"]);
  if (!verifyWebhook(body, signature, env.WEBHOOK_SECRET)) {
    send(response, 401, "invalid signature");
    return;
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body.toString("utf8"));
  } catch {
    send(response, 400, "invalid json");
    return;
  }

  const event = singleHeader(request.headers["x-github-event"]);
  if (!event) {
    send(response, 400, "missing event name");
    return;
  }

  const installation = installationId(payload);
  if (!installation) {
    send(response, 400, "missing installation id");
    return;
  }

  const delivery = singleHeader(request.headers["x-github-delivery"]) ?? "unknown";
  const octokit = await auth.installationClient(installation);
  const result = await dispatchWebhook(octokit, event, payload);
  console.info(JSON.stringify({ delivery, event, installation, result }));

  if (result === "invalid") {
    send(response, 422, "unsupported payload shape");
    return;
  }

  send(response, 202, result);
}

async function readBody(request: IncomingMessage, maximumBytes: number): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > maximumBytes) throw new Error("Webhook request body exceeds size limit.");
    chunks.push(buffer);
  }
  return Buffer.concat(chunks);
}

function singleHeader(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function send(response: ServerResponse, status: number, body: string): void {
  response.writeHead(status, { "content-type": "text/plain; charset=utf-8" });
  response.end(body);
}

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

server.listen(env.PORT, env.HOST, () => {
  console.log(`GitHub CLA System listening on http://${env.HOST}:${env.PORT}`);
});
