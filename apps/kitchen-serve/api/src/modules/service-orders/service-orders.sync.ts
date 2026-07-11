export function validateServiceOrderSync(input: { tenantId?: string; version?: number }) {
  return Boolean(input.tenantId && Number.isInteger(input.version));
}
