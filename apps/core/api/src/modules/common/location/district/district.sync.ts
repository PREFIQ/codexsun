export const districtSyncPolicy = {
  conflictPolicy: "server-wins",
  direction: "download-first",
  scope: "tenant-with-global-reference-data"
} as const;

export function resolveDistrictSyncScope(tenantId: string) {
  return { includeGlobal: true, tenantId };
}

