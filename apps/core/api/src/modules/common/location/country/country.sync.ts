export const countrySyncPolicy = {
  conflictPolicy: "server-wins",
  direction: "download-first",
  scope: "tenant-with-global-reference-data"
} as const;

export function resolveCountrySyncScope(tenantId: string) {
  return { includeGlobal: true, tenantId };
}

