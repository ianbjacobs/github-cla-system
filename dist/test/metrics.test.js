import { describe, expect, it } from "vitest";
import { Metrics } from "../src/observability/metrics.js";

describe("metrics", () => {
  it("emits deterministic Prometheus counters", () => {
    const metrics = new Metrics();
    metrics.increment("github_cla_http_requests_total", { path: "/health", method: "GET" });
    metrics.recordWebhook("issues", "handled");
    expect(metrics.toPrometheus()).toContain(
      'github_cla_http_requests_total{method="GET",path="/health"} 1',
    );
    expect(metrics.toPrometheus()).toContain(
      'github_cla_webhooks_total{event="issues",outcome="handled"} 1',
    );
  });
});
