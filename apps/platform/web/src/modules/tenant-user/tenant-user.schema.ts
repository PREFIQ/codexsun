import { z } from "zod";
export const tenantUserSchema = z.object({
  email: z.string().email(),
  isProtected: z.boolean(),
  name: z.string().trim().min(2).max(180),
  password: z.string().min(8).max(128).optional().or(z.literal("")),
  status: z.enum(["active", "inactive", "suspended"])
});
