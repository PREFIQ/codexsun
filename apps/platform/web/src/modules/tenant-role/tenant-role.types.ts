export type TenantRoleStatus = "active" | "inactive";
export type TenantRole = {
  id: number;
  isProtected: boolean;
  description: string;
  key: string;
  label: string;
  status: TenantRoleStatus;
  uuid: string;
};
export type TenantRoleSavePayload = Omit<TenantRole, "id" | "uuid">;
export type TenantRoleListFilters = { search?: string };
