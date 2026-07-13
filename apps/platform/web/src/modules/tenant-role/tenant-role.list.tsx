import { RegistryList, type RegistryField } from "../../shared/platform-registry-workspace";
import type { TenantRole } from "./tenant-role.types";
const statusOptions = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" }
];
export const tenantRoleFields: RegistryField<TenantRole>[] = [
  { key: "label", label: "Role", required: true },
  { key: "key", label: "Key", required: true },
  { key: "description", label: "Description", list: false },
  { key: "status", label: "Status", type: "select", options: statusOptions }
];
export function TenantRoleList(props: {
  loading: boolean;
  records: TenantRole[];
  onEdit: (record: TenantRole) => void;
  onView: (record: TenantRole) => void;
}) {
  return <RegistryList fields={tenantRoleFields} {...props} />;
}
