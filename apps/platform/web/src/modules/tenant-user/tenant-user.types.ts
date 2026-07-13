export type TenantUserStatus = "active" | "inactive" | "suspended";
export type TenantUser = {
  id: number;
  isProtected: boolean;
  email: string;
  name: string;
  password?: string;
  status: TenantUserStatus;
  uuid: string;
};
export type TenantUserSavePayload = Omit<TenantUser, "id" | "uuid">;
export type TenantUserListFilters = { search?: string };
