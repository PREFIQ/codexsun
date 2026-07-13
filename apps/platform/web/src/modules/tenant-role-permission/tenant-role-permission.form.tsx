import { RegistryForm, type RegistryField } from "../../shared/platform-registry-workspace";
import type {
  TenantRolePermission,
  TenantRolePermissionSavePayload
} from "./tenant-role-permission.types";
export function TenantRolePermissionForm(props: {
  error?: string;
  fields: RegistryField<TenantRolePermission>[];
  initialValue: TenantRolePermissionSavePayload;
  loading: boolean;
  onBack: () => void;
  onSubmit: (value: TenantRolePermissionSavePayload) => void;
  title: string;
}) {
  return <RegistryForm<TenantRolePermission> {...props} />;
}
