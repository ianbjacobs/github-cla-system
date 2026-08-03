import { createServer } from "node:http";
import { loadEnvironment } from "./config/env.js";
import { createRequestHandler } from "./http/app.js";
import { DeliveryCache } from "./infrastructure/deliveryCache.js";
import { GitHubAuth } from "./infrastructure/github/auth.js";
import { createJsonLogger } from "./observability/logger.js";
import { Metrics } from "./observability/metrics.js";
import { dispatchWebhook } from "./webhooks/dispatcher.js";

const env = await loadEnvironment();
const logger = createJsonLogger(env.LOG_LEVEL);
const metrics = new Metrics();
const auth = new GitHubAuth(env);
const deliveries = new DeliveryCache(
  env.DELIVERY_CACHE_TTL_SECONDS * 1000,
  env.DELIVERY_CACHE_MAX_ENTRIES,
);
let ready = false;
let shuttingDown = false;

const server = createServer(
  createRequestHandler({
    env,
    auth,
    dispatch: dispatchWebhook,
    deliveries,
    logger,
    metrics,
    isReady: () => ready && !shuttingDown,
  }),
);

server.listen(env.PORT, env.HOST, () => {
  ready = true;
  logger.info("server listening", { host: env.HOST, port: env.PORT });
});

server.on("error", (error) => {
  logger.error("server error", { error: error.message });
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => void shutdown(signal));
}

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  ready = false;
  logger.info("shutdown started", { signal });

  const forceExit = setTimeout(() => {
    logger.error("shutdown timed out", { timeoutMs: env.SHUTDOWN_TIMEOUT_MS });
    process.exit(1);
  }, env.SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();

  server.close((error) => {
    clearTimeout(forceExit);
    if (error) {
      logger.error("shutdown failed", { error: error.message });
      process.exitCode = 1;
    } else {
      logger.info("shutdown complete");
    }
  });
  server.closeIdleConnections();
}
