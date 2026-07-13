import { RegistryList, type RegistryField } from "../../shared/platform-registry-workspace";
import type { TenantPermission } from "./tenant-permission.types";
const statusOptions = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" }
];
export const tenantPermissionFields: RegistryField<TenantPermission>[] = [
  { key: "label", label: "Permission", required: true },
  { key: "key", label: "Key", required: true },
  { key: "description", label: "Description", list: false },
  { key: "status", label: "Status", type: "select", options: statusOptions }
];
export function TenantPermissionList(props: {
  loading: boolean;
  records: TenantPermission[];
  onEdit: (record: TenantPermission) => void;
  onView: (record: TenantPermission) => void;
}) {
  return <RegistryList fields={tenantPermissionFields} {...props} />;
}
