import { RegistryList, type RegistryField } from "../../shared/platform-registry-workspace";
import type { TenantRolePermission } from "./tenant-role-permission.types";
export function tenantRolePermissionFields(
  first: Array<{ label: string; value: string }>,
  second: Array<{ label: string; value: string }>
): RegistryField<TenantRolePermission>[] {
  return [
    {
      key: "roleId",
      label: "Role",
      type: "reference",
      options: first,
      format: (_value, record) => record.roleLabel
    },
    {
      key: "permissionId",
      label: "Permission",
      type: "reference",
      options: second,
      format: (_value, record) => record.permissionLabel
    },
    {
      key: "status",
      label: "Status",
      type: "select",
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" }
      ]
    }
  ];
}
export function TenantRolePermissionList(props: {
  fields: RegistryField<TenantRolePermission>[];
  loading: boolean;
  records: TenantRolePermission[];
  onEdit: (record: TenantRolePermission) => void;
  onView: (record: TenantRolePermission) => void;
}) {
  const { fields, ...rest } = props;
  return <RegistryList fields={fields} {...rest} />;
}
