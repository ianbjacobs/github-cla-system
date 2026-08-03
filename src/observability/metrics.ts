export type WebhookOutcome = "handled" | "ignored" | "invalid" | "duplicate" | "error";

export class Metrics {
  private readonly counters = new Map<string, number>();

  increment(name: string, labels: Record<string, string> = {}): void {
    const suffix = Object.entries(labels)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `${key}="${escapeLabel(value)}"`)
      .join(",");
    const key = suffix.length > 0 ? `${name}{${suffix}}` : name;
    this.counters.set(key, (this.counters.get(key) ?? 0) + 1);
  }

  recordWebhook(event: string, outcome: WebhookOutcome): void {
    this.increment("github_cla_webhooks_total", { event, outcome });
  }

  toPrometheus(): string {
    const lines = [
      "# HELP github_cla_http_requests_total HTTP requests received by the service.",
      "# TYPE github_cla_http_requests_total counter",
      "# HELP github_cla_webhooks_total GitHub webhook dispatch outcomes.",
      "# TYPE github_cla_webhooks_total counter",
    ];
    for (const [key, value] of [...this.counters.entries()].sort(([left], [right]) =>
      left.localeCompare(right),
    )) {
      lines.push(`${key} ${value}`);
    }
    return `${lines.join("\n")}\n`;
  }
}

function escapeLabel(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("\n", "\\n").replaceAll('"', '\\"');
}
