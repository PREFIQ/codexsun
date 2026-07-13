import { RegistryForm, type RegistryField } from "../../shared/platform-registry-workspace";
import type { TenantUserRole, TenantUserRoleSavePayload } from "./tenant-user-role.types";
export function TenantUserRoleForm(props: {
  error?: string;
  fields: RegistryField<TenantUserRole>[];
  initialValue: TenantUserRoleSavePayload;
  loading: boolean;
  onBack: () => void;
  onSubmit: (value: TenantUserRoleSavePayload) => void;
  title: string;
}) {
  return <RegistryForm<TenantUserRole> {...props} />;
}
