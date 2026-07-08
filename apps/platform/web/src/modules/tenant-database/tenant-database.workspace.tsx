import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { TenantDatabaseForm } from "./tenant-database.form";
import { useTenantDatabaseMutations, useTenantDatabaseQuery } from "./tenant-database.hooks";
import { TenantDatabaseList } from "./tenant-database.list";

export function TenantDatabaseWorkspace() {
  const query = useTenantDatabaseQuery();
  const mutations = useTenantDatabaseMutations();
  const busy = mutations.backup.isPending || mutations.migrate.isPending || mutations.restore.isPending;
  return (
    <WorkspacePage
      title="Tenant Databases"
      description="Watch tenant database live status, migration sync, backup requests, and restore readiness."
      technicalName="page.database.tenants"
      actions={<TenantDatabaseForm loading={query.isLoading} onRefresh={() => void query.refetch()} />}
    >
      <TenantDatabaseList
        busy={busy}
        records={query.data ?? []}
        onBackup={(tenantId) => mutations.backup.mutate(tenantId)}
        onMigrate={(tenantId) => mutations.migrate.mutate(tenantId)}
        onRestore={(tenantId) => mutations.restore.mutate(tenantId)}
      />
    </WorkspacePage>
  );
}
