export function createServiceOrderEvent(orderId: string, action: string, tenantId: string) {
  return {
    action,
    aggregate: "service-order",
    orderId,
    tenantId,
    occurredAt: new Date().toISOString()
  };
}
