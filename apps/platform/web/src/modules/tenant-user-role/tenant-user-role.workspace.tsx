import { toast } from "sonner";
import { RegistryWorkspace } from "../../shared/platform-registry-workspace";
import {
  useTenantUserRolesQuery,
  useTenantUserRoleLookups,
  useTenantUserRoleMutations
} from "./tenant-user-role.hooks";
import { tenantUserRoleFields } from "./tenant-user-role.list";
import { tenantUserRoleSchema } from "./tenant-user-role.schema";
import type { TenantUserRoleSavePayload } from "./tenant-user-role.types";
const empty: TenantUserRoleSavePayload = {
  isProtected: false,
  userId: 0,
  userName: "",
  userEmail: "",
  roleId: 0,
  roleLabel: "",
  roleKey: "",
  status: "active"
};
export function TenantUserRoleWorkspace() {
  const query = useTenantUserRolesQuery();
  const lookups = useTenantUserRoleLookups();
  const mutations = useTenantUserRoleMutations();
  const fields = tenantUserRoleFields(
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
    value: TenantUserRoleSavePayload,
    action: (payload: TenantUserRoleSavePayload) => Promise<unknown>,
    success: string
  ) => {
    const normalized = { ...value, userId: Number(value.userId), roleId: Number(value.roleId) };
    const parsed = tenantUserRoleSchema.safeParse(normalized);
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
      createLabel="New user role"
      description="Assign tenant roles to tenant users."
      fields={fields}
      initialValue={empty}
      loading={query.isLoading || lookups.isLoading}
      records={query.data ?? []}
      saving={mutations.create.isPending || mutations.update.isPending}
      saveError={failed instanceof Error ? failed.message : undefined}
      singular="User role"
      technicalName="page.application.access.user-roles"
      title="User Roles"
      onActivate={(record) =>
        runMutation(() => mutations.activate.mutateAsync(record), "User role restored.")
      }
      onCreate={(value) => save(value, mutations.create.mutateAsync, "User role assigned.")}
      onDeactivate={(record) =>
        runMutation(() => mutations.deactivate.mutateAsync(record), "User role deactivated.")
      }
      onForceDelete={(record) =>
        runMutation(
          () => mutations.forceDelete.mutateAsync(record),
          "User role permanently removed."
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
          "User role updated."
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
    toast.error(error instanceof Error ? error.message : "The user-role action failed.");
    return false;
  }
}
