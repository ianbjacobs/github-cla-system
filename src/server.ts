import { createServer } from "node:http";
import { loadEnvironment } from "./config/env.js";
import { GitHubAuth } from "./infrastructure/github/auth.js";
import { verifyWebhook } from "./infrastructure/github/webhook.js";
import { routeWebhook } from "./webhooks/router.js";

const env = await loadEnvironment();
const auth = new GitHubAuth(env);

const server = createServer(async (request, response) => {
  if (request.method === "GET" && request.url === "/health") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ status: "ok" }));
    return;
  }
  if (request.method !== "POST" || request.url !== "/webhooks/github") {
    response.writeHead(404).end();
    return;
  }
  const chunks: Buffer[] = [];
  for await (const chunk of request)
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  const body = Buffer.concat(chunks);
  if (
    !verifyWebhook(
      body,
      request.headers["x-hub-signature-256"] as string | undefined,
      env.WEBHOOK_SECRET,
    )
  ) {
    response.writeHead(401).end("invalid signature");
    return;
  }
  try {
    const payload = JSON.parse(body.toString("utf8"));
    const installationId = payload.installation?.id;
    if (!Number.isSafeInteger(installationId))
      throw new Error("Webhook payload has no installation ID.");
    const octokit = await auth.installationClient(installationId);
    await routeWebhook(octokit, String(request.headers["x-github-event"] ?? ""), payload);
    response.writeHead(202).end("accepted");
  } catch (error) {
    console.error(error);
    response.writeHead(500).end("internal error");
  }
});
server.listen(env.PORT, env.HOST, () =>
  console.log(`GitHub CLA System listening on http://${env.HOST}:${env.PORT}`),
);
