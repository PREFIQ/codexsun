export const citySyncPolicy = {
  conflictPolicy: "server-wins",
  direction: "download-first",
  scope: "tenant-with-global-reference-data"
} as const;

export function resolveCitySyncScope(tenantId: string) {
  return { includeGlobal: true, tenantId };
}

