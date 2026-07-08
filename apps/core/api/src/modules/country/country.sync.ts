export const countrySync = {
  conflictPolicy: "server-wins",
  direction: "pull-only",
  scope: "tenant"
} as const;

export function countryNeedsSync(localUpdatedAt: string | null, serverUpdatedAt: string) {
  return !localUpdatedAt || Date.parse(serverUpdatedAt) > Date.parse(localUpdatedAt);
}
