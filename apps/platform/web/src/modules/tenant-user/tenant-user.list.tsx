import { RegistryList, type RegistryField } from "../../shared/platform-registry-workspace";
import type { TenantUser } from "./tenant-user.types";
const statusOptions = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Suspended", value: "suspended" }
];
export const tenantUserFields: RegistryField<TenantUser>[] = [
  { key: "name", label: "User", required: true },
  { key: "email", label: "Email", required: true },
  { key: "password", label: "Password", list: false, type: "password" },
  { key: "status", label: "Status", type: "select", options: statusOptions }
];
export function TenantUserList(props: {
  loading: boolean;
  records: TenantUser[];
  onEdit: (record: TenantUser) => void;
  onView: (record: TenantUser) => void;
}) {
  return <RegistryList fields={tenantUserFields} {...props} />;
}
