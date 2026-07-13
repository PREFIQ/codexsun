import { z } from "zod";
export const tenantRolePermissionSchema = z.object({
  isProtected: z.boolean(),
  roleId: z.number().int().positive("Role is required."),
  roleLabel: z.string(),
  roleKey: z.string(),
  permissionId: z.number().int().positive("Permission is required."),
  permissionLabel: z.string(),
  permissionKey: z.string(),
  status: z.enum(["active", "inactive"])
});
