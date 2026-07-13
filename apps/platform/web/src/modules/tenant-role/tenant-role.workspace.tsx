import { toast } from "sonner";
import { RegistryWorkspace } from "../../shared/platform-registry-workspace";
import { useTenantRolesQuery, useTenantRoleMutations } from "./tenant-role.hooks";
import { tenantRoleFields } from "./tenant-role.list";
import { tenantRoleSchema } from "./tenant-role.schema";
import type { TenantRoleSavePayload } from "./tenant-role.types";
const empty: TenantRoleSavePayload = {
  description: "",
  isProtected: false,
  key: "",
  label: "",
  status: "active"
};
export function TenantRoleWorkspace() {
  const query = useTenantRolesQuery();
  const mutations = useTenantRoleMutations();
  const save = async (
    value: TenantRoleSavePayload,
    action: (payload: TenantRoleSavePayload) => Promise<unknown>,
    success: string
  ) => {
    const parsed = tenantRoleSchema.safeParse(value);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check the details.");
      return false;
    }
    return runMutation(() => action(parsed.data as TenantRoleSavePayload), success);
  };
  const failed =
    mutations.create.error ??
    mutations.update.error ??
    mutations.activate.error ??
    mutations.deactivate.error ??
    mutations.forceDelete.error;
  return (
    <RegistryWorkspace
      createLabel="New role"
      description="Manage tenant roles and their lifecycle."
      fields={tenantRoleFields}
      initialValue={empty}
      loading={query.isLoading}
      records={query.data ?? []}
      saving={mutations.create.isPending || mutations.update.isPending}
      saveError={failed instanceof Error ? failed.message : undefined}
      singular="Role"
      technicalName="page.application.access.roles"
      title="Roles"
      onActivate={(record) =>
        runMutation(() => mutations.activate.mutateAsync(record), "Role restored.")
      }
      onCreate={(value) => save(value, mutations.create.mutateAsync, "Role created.")}
      onDeactivate={(record) =>
        runMutation(() => mutations.deactivate.mutateAsync(record), "Role deactivated.")
      }
      onForceDelete={(record) =>
        runMutation(() => mutations.forceDelete.mutateAsync(record), "Role permanently deleted.")
      }
      onRefresh={() => void query.refetch()}
      onUpdate={(id, value) =>
        save(value, (payload) => mutations.update.mutateAsync({ id, payload }), "Role updated.")
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
    toast.error(error instanceof Error ? error.message : "The role action failed.");
    return false;
  }
}
