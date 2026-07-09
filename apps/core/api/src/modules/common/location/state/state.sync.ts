export const stateSyncPolicy = {
  conflictPolicy: "server-wins",
  direction: "download-first",
  scope: "tenant-with-global-reference-data"
} as const;

export function resolveStateSyncScope(tenantId: string) {
  return { includeGlobal: true, tenantId };
}

