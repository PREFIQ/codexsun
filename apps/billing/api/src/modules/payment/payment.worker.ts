export async function processPaymentEvent(event: { type: string; paymentId: string }) { return { ...event, processed: true, module: "payment" as const }; }
