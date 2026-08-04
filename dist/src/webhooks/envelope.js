import { z } from "zod";

const installationEnvelopeSchema = z.object({
  installation: z.object({ id: z.number().int().positive() }),
});
export function installationId(payload) {
  return installationEnvelopeSchema.parse(payload).installation.id;
}
