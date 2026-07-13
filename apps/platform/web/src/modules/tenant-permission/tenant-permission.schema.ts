import { z } from "zod";
export const tenantPermissionSchema = z.object({
  description: z.string().trim().max(500),
  isProtected: z.boolean(),
  key: z.string().trim().min(2).max(160),
  label: z.string().trim().min(2).max(180),
  status: z.enum(["active", "inactive"])
});
