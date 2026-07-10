export function shouldSyncMasterRecord(input: { active?: boolean; updatedAt?: string }) {
  return input.active !== false && Boolean(input.updatedAt);
}
