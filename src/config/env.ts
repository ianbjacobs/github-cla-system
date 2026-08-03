import { readFile } from "node:fs/promises";
import { z } from "zod";

const schema = z.object({
  APP_ID: z.coerce.number().int().positive(),
  PRIVATE_KEY_PATH: z.string().min(1),
  WEBHOOK_SECRET: z.string().min(16),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  GITHUB_API_URL: z.string().url().default("https://api.github.com"),
});

export type Environment = z.infer<typeof schema> & { privateKey: string };

export async function loadEnvironment(
  source: NodeJS.ProcessEnv = process.env,
): Promise<Environment> {
  const parsed = schema.parse(source);
  return { ...parsed, privateKey: await readFile(parsed.PRIVATE_KEY_PATH, "utf8") };
}
