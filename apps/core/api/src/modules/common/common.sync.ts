export const commonSyncPolicy = {
  conflictPolicy: "area-owned",
  direction: "download-first",
  scope: "tenant-with-global-reference-data"
} as const;

export function resolveCommonSyncAreas(tenantId: string) {
  return [{ area: "location", includeGlobal: true, tenantId }];
}

