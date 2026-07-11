export function validateMigrationCheckpoint(input: { tenantId?: string; checksum?: string }) {
  return Boolean(input.tenantId?.trim() && input.checksum?.trim());
}
