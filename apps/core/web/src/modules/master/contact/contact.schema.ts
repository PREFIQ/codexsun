import { z } from "zod";
export const contactSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  primaryEmail: z.string().email().nullable().optional()
});
