import { RegistryList, type RegistryField } from "../../shared/platform-registry-workspace";
import type { TenantUserRole } from "./tenant-user-role.types";
export function tenantUserRoleFields(
  first: Array<{ label: string; value: string }>,
  second: Array<{ label: string; value: string }>
): RegistryField<TenantUserRole>[] {
  return [
    {
      key: "userId",
      label: "User",
      type: "reference",
      options: first,
      format: (_value, record) => record.userName
    },
    {
      key: "roleId",
      label: "Role",
      type: "reference",
      options: second,
      format: (_value, record) => record.roleLabel
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
export function TenantUserRoleList(props: {
  fields: RegistryField<TenantUserRole>[];
  loading: boolean;
  records: TenantUserRole[];
  onEdit: (record: TenantUserRole) => void;
  onView: (record: TenantUserRole) => void;
}) {
  const { fields, ...rest } = props;
  return <RegistryList fields={fields} {...rest} />;
}
