import { z } from "zod";
export const tenantUserRoleSchema = z.object({
  isProtected: z.boolean(),
  userId: z.number().int().positive("User is required."),
  userName: z.string(),
  userEmail: z.string(),
  roleId: z.number().int().positive("Role is required."),
  roleLabel: z.string(),
  roleKey: z.string(),
  status: z.enum(["active", "inactive"])
});
