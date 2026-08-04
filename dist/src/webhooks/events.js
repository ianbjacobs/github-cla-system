import { z } from "zod";

const userSchema = z.object({
  id: z.number().int().positive(),
  login: z.string().min(1),
  node_id: z.string().min(1),
});
const repositorySchema = z.object({
  name: z.string().min(1),
  owner: z.object({ login: z.string().min(1) }),
});
const labelSchema = z.union([z.string(), z.object({ name: z.string().nullable().optional() })]);
const installationSchema = z.object({ id: z.number().int().positive() });
export const pullRequestWebhookSchema = z.object({
  action: z.enum(["opened", "reopened", "synchronize", "closed"]),
  installation: installationSchema,
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
export const issuesWebhookSchema = z.object({
  action: z.enum(["opened", "edited", "reopened"]),
  installation: installationSchema,
  repository: repositorySchema,
  issue: z.object({
    number: z.number().int().positive(),
    title: z.string().min(1),
    node_id: z.string().min(1),
    body: z.string().nullable(),
    state: z.string(),
    created_at: z.string().datetime(),
    user: userSchema.nullable(),
    pull_request: z.unknown().optional(),
  }),
});
export const pushWebhookSchema = z.object({
  installation: installationSchema,
  repository: repositorySchema.extend({ default_branch: z.string().min(1) }),
  ref: z.string().min(1),
});
export function parseSupportedWebhook(event, payload) {
  if (event === "pull_request") {
    const result = pullRequestWebhookSchema.safeParse(payload);
    return result.success ? { kind: "pull_request", payload: result.data } : null;
  }
  if (event === "issues") {
    const result = issuesWebhookSchema.safeParse(payload);
    return result.success ? { kind: "issues", payload: result.data } : null;
  }
  if (event === "push") {
    const result = pushWebhookSchema.safeParse(payload);
    return result.success ? { kind: "push", payload: result.data } : null;
  }
  return null;
}
export function installationId(payload) {
  const result = z.object({ installation: installationSchema }).safeParse(payload);
  return result.success ? result.data.installation.id : null;
}
