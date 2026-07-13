export type TenantRolePermissionStatus = "active" | "inactive";
export type TenantRolePermission = {
  id: number;
  isProtected: boolean;
  roleId: number;
  roleLabel: string;
  roleKey: string;
  permissionId: number;
  permissionLabel: string;
  permissionKey: string;
  status: TenantRolePermissionStatus;
  uuid: string;
};
export type TenantRolePermissionSavePayload = Omit<TenantRolePermission, "id" | "uuid">;
export type TenantRolePermissionListFilters = { search?: string };
export type TenantRolePermissionLookup = {
  id: number;
  key?: string;
  label?: string;
  name?: string;
  email?: string;
  status: string;
};
