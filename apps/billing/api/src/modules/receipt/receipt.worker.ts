export async function processReceiptEvent(event: { type: string; receiptId: string }) {
  return { ...event, processed: true, module: "receipt" as const };
}
