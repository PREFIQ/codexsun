export const pincodeSyncPolicy = {
  conflictPolicy: "server-wins",
  direction: "download-first",
  scope: "tenant-with-global-reference-data"
} as const;

export function resolvePincodeSyncScope(tenantId: string) {
  return { includeGlobal: true, tenantId };
}

