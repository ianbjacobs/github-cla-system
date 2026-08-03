import { z } from "zod";

const userSchema = z.object({ id: z.number().int().positive(), login: z.string().min(1) });
const repositorySchema = z.object({
  name: z.string().min(1),
  owner: z.object({ login: z.string().min(1) }),
});
const labelSchema = z.union([z.string(), z.object({ name: z.string().nullable().optional() })]);

export const pullRequestEventSchema = z.object({
  action: z.enum(["opened", "reopened", "synchronize", "closed"]),
  installation: z.object({ id: z.number().int().positive() }),
  repository: repositorySchema,
  pull_request: z.object({
    number: z.number().int().positive(),
    body: z.string().nullable(),
    merged: z.boolean().optional(),
    user: userSchema.nullable(),
    head: z.object({ sha: z.string().min(1) }),
    labels: z.array(labelSchema),
  }),
});

export const issuesEventSchema = z.object({
  action: z.enum(["opened", "edited", "reopened"]),
  installation: z.object({ id: z.number().int().positive() }),
  repository: repositorySchema,
  issue: z.object({
    number: z.number().int().positive(),
    node_id: z.string().min(1),
    body: z.string().nullable(),
    state: z.string(),
    user: userSchema.nullable(),
    pull_request: z.unknown().optional(),
  }),
});

export const supportedEventSchema = z.discriminatedUnion("event", [
  z.object({ event: z.literal("pull_request"), payload: pullRequestEventSchema }),
  z.object({ event: z.literal("issues"), payload: issuesEventSchema }),
]);

export type PullRequestEvent = z.infer<typeof pullRequestEventSchema>;
export type IssuesEvent = z.infer<typeof issuesEventSchema>;
export type SupportedEvent = z.infer<typeof supportedEventSchema>;

export function parseSupportedEvent(event: string, payload: unknown): SupportedEvent | null {
  if (event !== "pull_request" && event !== "issues") return null;
  const result = supportedEventSchema.safeParse({ event, payload });
  return result.success ? result.data : null;
}
