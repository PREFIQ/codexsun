export async function syncPaymentModule() {
  return { module: "payment" as const, synced: false };
}
