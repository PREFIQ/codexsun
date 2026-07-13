import { toast } from "sonner";
import { RegistryWorkspace } from "../../shared/platform-registry-workspace";
import { useTenantPermissionsQuery, useTenantPermissionMutations } from "./tenant-permission.hooks";
import { tenantPermissionFields } from "./tenant-permission.list";
import { tenantPermissionSchema } from "./tenant-permission.schema";
import type { TenantPermissionSavePayload } from "./tenant-permission.types";
const empty: TenantPermissionSavePayload = {
  description: "",
  isProtected: false,
  key: "",
  label: "",
  status: "active"
};
export function TenantPermissionWorkspace() {
  const query = useTenantPermissionsQuery();
  const mutations = useTenantPermissionMutations();
  const save = (
    value: TenantPermissionSavePayload,
    action: (payload: TenantPermissionSavePayload) => Promise<unknown>,
    success: string
  ) => {
    const parsed = tenantPermissionSchema.safeParse(value);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check the details.");
      return Promise.resolve(false);
    }
    return runMutation(() => action(parsed.data as TenantPermissionSavePayload), success);
  };
  const failed =
    mutations.create.error ??
    mutations.update.error ??
    mutations.activate.error ??
    mutations.deactivate.error ??
    mutations.forceDelete.error;
  return (
    <RegistryWorkspace
      createLabel="New permission"
      description="Manage tenant permission definitions and lifecycle."
      fields={tenantPermissionFields}
      initialValue={empty}
      loading={query.isLoading}
      records={query.data ?? []}
      saving={mutations.create.isPending || mutations.update.isPending}
      saveError={failed instanceof Error ? failed.message : undefined}
      singular="Permission"
      technicalName="page.application.access.permissions"
      title="Permissions"
      onActivate={(record) =>
        runMutation(() => mutations.activate.mutateAsync(record), "Permission restored.")
      }
      onCreate={(value) => save(value, mutations.create.mutateAsync, "Permission created.")}
      onDeactivate={(record) =>
        runMutation(() => mutations.deactivate.mutateAsync(record), "Permission deactivated.")
      }
      onForceDelete={(record) =>
        runMutation(
          () => mutations.forceDelete.mutateAsync(record),
          "Permission permanently deleted."
        )
      }
      onRefresh={() => void query.refetch()}
      onUpdate={(id, value) =>
        save(
          value,
          (payload) => mutations.update.mutateAsync({ id, payload }),
          "Permission updated."
        )
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
    toast.error(error instanceof Error ? error.message : "The permission action failed.");
    return false;
  }
}
