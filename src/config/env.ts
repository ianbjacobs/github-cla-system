import { readFile } from "node:fs/promises";
import { z } from "zod";

const booleanFromEnvironment = z
  .enum(["true", "false"])
  .default("false")
  .transform((value) => value === "true");

const schema = z.object({
  APP_ID: z.coerce.number().int().positive(),
  PRIVATE_KEY_PATH: z.string().min(1),
  WEBHOOK_SECRET: z.string().min(16),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  GITHUB_API_URL: z.string().url().default("https://api.github.com"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  MAX_WEBHOOK_BYTES: z.coerce
    .number()
    .int()
    .min(1024)
    .max(10 * 1024 * 1024)
    .default(1024 * 1024),
  DELIVERY_CACHE_TTL_SECONDS: z.coerce.number().int().min(60).max(86400).default(600),
  DELIVERY_CACHE_MAX_ENTRIES: z.coerce.number().int().min(100).max(100000).default(10000),
  SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().min(1000).max(60000).default(10000),
  ENABLE_METRICS: booleanFromEnvironment,
});

export type Environment = z.infer<typeof schema> & { privateKey: string };

export async function loadEnvironment(
  source: NodeJS.ProcessEnv = process.env,
): Promise<Environment> {
  const parsed = schema.parse(source);
  return { ...parsed, privateKey: await readFile(parsed.PRIVATE_KEY_PATH, "utf8") };
}
