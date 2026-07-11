export async function processKitchenNotification(input: { orderId: string; tenantId: string }) {
  if (!input.tenantId) throw new Error("Tenant context required.");
  return { processed: true, orderId: input.orderId };
}
