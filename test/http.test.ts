import { createHmac } from "node:crypto";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import type { Octokit } from "@octokit/rest";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Environment } from "../src/config/env.js";
import { createRequestHandler } from "../src/http/app.js";
import { DeliveryCache } from "../src/infrastructure/deliveryCache.js";
import type { Logger } from "../src/observability/logger.js";
import { Metrics } from "../src/observability/metrics.js";

const servers: Array<ReturnType<typeof createServer>> = [];

afterEach(async () => {
  await Promise.all(
    servers
      .splice(0)
      .map(
        (server) =>
          new Promise<void>((resolve, reject) =>
            server.close((error) => (error ? reject(error) : resolve())),
          ),
      ),
  );
});

const env: Environment = {
  APP_ID: 1,
  PRIVATE_KEY_PATH: "/tmp/key.pem",
  WEBHOOK_SECRET: "a-very-long-test-secret",
  HOST: "127.0.0.1",
  PORT: 3000,
  GITHUB_API_URL: "https://api.github.com",
  LOG_LEVEL: "info",
  MAX_WEBHOOK_BYTES: 1024,
  DELIVERY_CACHE_TTL_SECONDS: 600,
  DELIVERY_CACHE_MAX_ENTRIES: 100,
  SHUTDOWN_TIMEOUT_MS: 10000,
  ENABLE_METRICS: true,
  privateKey: "test-key",
};

const logger: Logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

describe("HTTP application", () => {
  it("reports liveness and readiness separately", async () => {
    const baseUrl = await startApp(false);
    expect(await fetch(`${baseUrl}/health/live`).then((response) => response.status)).toBe(200);
    expect(await fetch(`${baseUrl}/health/ready`).then((response) => response.status)).toBe(503);
  });

  it("deduplicates successfully processed GitHub deliveries", async () => {
    const dispatch = vi.fn(async () => "handled" as const);
    const baseUrl = await startApp(true, dispatch);
    const body = JSON.stringify({ installation: { id: 123 } });
    const signature = `sha256=${createHmac("sha256", env.WEBHOOK_SECRET).update(body).digest("hex")}`;
    const headers = {
      "content-type": "application/json",
      "x-github-event": "issues",
      "x-github-delivery": "delivery-1",
      "x-hub-signature-256": signature,
    };

    const first = await fetch(`${baseUrl}/webhooks/github`, { method: "POST", headers, body });
    const second = await fetch(`${baseUrl}/webhooks/github`, { method: "POST", headers, body });

    expect(await first.text()).toBe("handled");
    expect(await second.text()).toBe("duplicate");
    expect(dispatch).toHaveBeenCalledOnce();
  });
});

async function startApp(
  ready: boolean,
  dispatch: (
    octokit: Octokit,
    event: string,
    payload: unknown,
  ) => Promise<"handled" | "ignored" | "invalid"> = async () => "ignored",
): Promise<string> {
  const server = createServer(
    createRequestHandler({
      env,
      auth: { installationClient: async () => ({}) as Octokit },
      dispatch,
      deliveries: new DeliveryCache(60_000, 100),
      logger,
      metrics: new Metrics(),
      isReady: () => ready,
    }),
  );
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address() as AddressInfo;
  return `http://127.0.0.1:${address.port}`;
}
