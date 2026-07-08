import { z } from "zod";

export const queueJobActionSchema = z.object({
  id: z.number().int().positive()
});

export function queueJobAction(id: number) {
  return queueJobActionSchema.parse({ id });
}
