import { toast } from "sonner";
import { RegistryWorkspace } from "../../shared/platform-registry-workspace";
import {
  useTenantRolePermissionsQuery,
  useTenantRolePermissionLookups,
  useTenantRolePermissionMutations
} from "./tenant-role-permission.hooks";
import { tenantRolePermissionFields } from "./tenant-role-permission.list";
import { tenantRolePermissionSchema } from "./tenant-role-permission.schema";
import type { TenantRolePermissionSavePayload } from "./tenant-role-permission.types";
const empty: TenantRolePermissionSavePayload = {
  isProtected: false,
  roleId: 0,
  roleLabel: "",
  roleKey: "",
  permissionId: 0,
  permissionLabel: "",
  permissionKey: "",
  status: "active"
};
export function TenantRolePermissionWorkspace() {
  const query = useTenantRolePermissionsQuery();
  const lookups = useTenantRolePermissionLookups();
  const mutations = useTenantRolePermissionMutations();
  const fields = tenantRolePermissionFields(
    (lookups.data?.first ?? [])
      .filter((item) => item.status === "active")
      .map((item) => ({
        label: item.name ?? item.label ?? item.email ?? String(item.id),
        value: String(item.id)
      })),
    (lookups.data?.second ?? [])
      .filter((item) => item.status === "active")
      .map((item) => ({
        label: item.label ?? item.name ?? item.key ?? String(item.id),
        value: String(item.id)
      }))
  );
  const save = (
    value: TenantRolePermissionSavePayload,
    action: (payload: TenantRolePermissionSavePayload) => Promise<unknown>,
    success: string
  ) => {
    const normalized = {
      ...value,
      roleId: Number(value.roleId),
      permissionId: Number(value.permissionId)
    };
    const parsed = tenantRolePermissionSchema.safeParse(normalized);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check the assignment.");
      return Promise.resolve(false);
    }
    return runMutation(() => action(parsed.data), success);
  };
  const failed =
    mutations.create.error ??
    mutations.update.error ??
    mutations.activate.error ??
    mutations.deactivate.error ??
    mutations.forceDelete.error;
  return (
    <RegistryWorkspace
      createLabel="New role permission"
      description="Grant tenant permissions to tenant roles."
      fields={fields}
      initialValue={empty}
      loading={query.isLoading || lookups.isLoading}
      records={query.data ?? []}
      saving={mutations.create.isPending || mutations.update.isPending}
      saveError={failed instanceof Error ? failed.message : undefined}
      singular="Role permission"
      technicalName="page.application.access.role-permissions"
      title="Role Permissions"
      onActivate={(record) =>
        runMutation(() => mutations.activate.mutateAsync(record), "Role permission restored.")
      }
      onCreate={(value) => save(value, mutations.create.mutateAsync, "Role permission granted.")}
      onDeactivate={(record) =>
        runMutation(() => mutations.deactivate.mutateAsync(record), "Role permission deactivated.")
      }
      onForceDelete={(record) =>
        runMutation(
          () => mutations.forceDelete.mutateAsync(record),
          "Role permission permanently removed."
        )
      }
      onRefresh={() => {
        void query.refetch();
        void lookups.refetch();
      }}
      onUpdate={(id, value) =>
        save(
          value,
          (payload) => mutations.update.mutateAsync({ id, payload }),
          "Role permission updated."
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
    toast.error(error instanceof Error ? error.message : "The role-permission action failed.");
    return false;
  }
}
