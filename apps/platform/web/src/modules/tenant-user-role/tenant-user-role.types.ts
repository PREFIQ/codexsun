export type TenantUserRoleStatus = "active" | "inactive";
export type TenantUserRole = {
  id: number;
  isProtected: boolean;
  userId: number;
  userName: string;
  userEmail: string;
  roleId: number;
  roleLabel: string;
  roleKey: string;
  status: TenantUserRoleStatus;
  uuid: string;
};
export type TenantUserRoleSavePayload = Omit<TenantUserRole, "id" | "uuid">;
export type TenantUserRoleListFilters = { search?: string };
export type TenantUserRoleLookup = {
  id: number;
  key?: string;
  label?: string;
  name?: string;
  email?: string;
  status: string;
};
