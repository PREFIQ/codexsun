export function createMappingsTransformsEvent(mappingPlanId: number, action: string) {
  return {
    name: `data-bridge.mapping.${action}`,
    mappingPlanId,
    occurredAt: new Date().toISOString()
  };
}
