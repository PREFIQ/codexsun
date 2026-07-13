import { RegistryForm } from "../../shared/platform-registry-workspace";
import { tenantPermissionFields } from "./tenant-permission.list";
import type { TenantPermission, TenantPermissionSavePayload } from "./tenant-permission.types";
export function TenantPermissionForm(props: {
  error?: string;
  initialValue: TenantPermissionSavePayload;
  loading: boolean;
  onBack: () => void;
  onSubmit: (value: TenantPermissionSavePayload) => void;
  title: string;
}) {
  return <RegistryForm<TenantPermission> fields={tenantPermissionFields} {...props} />;
}
