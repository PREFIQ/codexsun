import { toast } from "sonner";
import { RegistryWorkspace } from "../../shared/platform-registry-workspace";
import { useTenantUsersQuery, useTenantUserMutations } from "./tenant-user.hooks";
import { tenantUserFields } from "./tenant-user.list";
import { tenantUserSchema } from "./tenant-user.schema";
import type { TenantUserSavePayload } from "./tenant-user.types";
const empty: TenantUserSavePayload = {
  email: "",
  isProtected: false,
  name: "",
  password: "",
  status: "active"
};
export function TenantUserWorkspace() {
  const query = useTenantUsersQuery();
  const mutations = useTenantUserMutations();
  const save = async (
    value: TenantUserSavePayload,
    action: (payload: TenantUserSavePayload) => Promise<unknown>,
    success: string
  ) => {
    const parsed = tenantUserSchema.safeParse(value);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check the details.");
      return false;
    }
    return runMutation(() => action(parsed.data as TenantUserSavePayload), success);
  };
  const failed =
    mutations.create.error ??
    mutations.update.error ??
    mutations.activate.error ??
    mutations.deactivate.error ??
    mutations.forceDelete.error;
  return (
    <RegistryWorkspace
      createLabel="New user"
      description="Manage tenant users, credentials, and account lifecycle."
      fields={tenantUserFields}
      initialValue={empty}
      loading={query.isLoading}
      records={query.data ?? []}
      saving={mutations.create.isPending || mutations.update.isPending}
      saveError={failed instanceof Error ? failed.message : undefined}
      singular="User"
      technicalName="page.application.access.users"
      title="Users"
      onActivate={(record) =>
        runMutation(() => mutations.activate.mutateAsync(record), "User restored.")
      }
      onCreate={(value) => save(value, mutations.create.mutateAsync, "User created.")}
      onDeactivate={(record) =>
        runMutation(() => mutations.deactivate.mutateAsync(record), "User deactivated.")
      }
      onForceDelete={(record) =>
        runMutation(() => mutations.forceDelete.mutateAsync(record), "User permanently deleted.")
      }
      onRefresh={() => void query.refetch()}
      onUpdate={(id, value) =>
        save(value, (payload) => mutations.update.mutateAsync({ id, payload }), "User updated.")
      }
    />
  );
}

async function runMutation(action: () => Promise<unknown>, success: string) {
  try {
    await action();
    toast.success(success);
    return true;
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "The user action failed.");
    return false;
  }
}
