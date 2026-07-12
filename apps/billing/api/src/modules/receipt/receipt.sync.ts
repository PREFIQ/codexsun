export async function syncReceiptModule() {
  return { module: "receipt" as const, synced: false };
}
