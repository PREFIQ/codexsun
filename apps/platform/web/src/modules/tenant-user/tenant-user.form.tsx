import { RegistryForm } from "../../shared/platform-registry-workspace";
import { tenantUserFields } from "./tenant-user.list";
import type { TenantUser, TenantUserSavePayload } from "./tenant-user.types";
export function TenantUserForm(props: {
  error?: string;
  initialValue: TenantUserSavePayload;
  loading: boolean;
  onBack: () => void;
  onSubmit: (value: TenantUserSavePayload) => void;
  title: string;
}) {
  return <RegistryForm<TenantUser> fields={tenantUserFields} {...props} />;
}
