import { RegistryForm } from "../../shared/platform-registry-workspace";
import { tenantRoleFields } from "./tenant-role.list";
import type { TenantRole, TenantRoleSavePayload } from "./tenant-role.types";
export function TenantRoleForm(props: {
  error?: string;
  initialValue: TenantRoleSavePayload;
  loading: boolean;
  onBack: () => void;
  onSubmit: (value: TenantRoleSavePayload) => void;
  title: string;
}) {
  return <RegistryForm<TenantRole> fields={tenantRoleFields} {...props} />;
}
