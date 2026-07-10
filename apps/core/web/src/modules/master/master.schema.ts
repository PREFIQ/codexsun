import { z } from "zod";

export const masterSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1)
});
