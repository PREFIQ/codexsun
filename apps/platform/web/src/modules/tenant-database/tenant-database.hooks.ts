import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tenantMaintenanceNote } from "./tenant-database.schema";
import { listTenantDatabaseStatus, migrateTenantDatabase, requestTenantDatabaseBackup, requestTenantDatabaseRestore } from "./tenant-database.services";

export const tenantDatabaseQueryKey = ["admin", "database", "tenants"] as const;

export function useTenantDatabaseQuery() {
  return useQuery({ queryFn: listTenantDatabaseStatus, queryKey: tenantDatabaseQueryKey, refetchInterval: 15_000 });
}

export function useTenantDatabaseMutations() {
  const client = useQueryClient();
  const done = () => client.invalidateQueries({ queryKey: tenantDatabaseQueryKey });
  return {
    backup: useMutation({ mutationFn: (tenantId: number) => requestTenantDatabaseBackup(tenantId, tenantMaintenanceNote(tenantId, "Tenant backup")), onSuccess: done }),
    migrate: useMutation({ mutationFn: (tenantId: number) => migrateTenantDatabase(tenantId, tenantMaintenanceNote(tenantId, "Tenant migration")), onSuccess: done }),
    restore: useMutation({ mutationFn: (tenantId: number) => requestTenantDatabaseRestore(tenantId, tenantMaintenanceNote(tenantId, "Tenant restore")), onSuccess: done })
  };
}
