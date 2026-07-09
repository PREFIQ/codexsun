import type { QuotationStatus } from "./quotation.types.js";

export const quotationEvents = {
  changed: "billing.quotation.changed",
  confirmed: "billing.quotation.confirmed"
} as const;

export function createQuotationEvent(action: "created" | "updated" | "confirmed" | "cancelled", payload: { id: string; status: QuotationStatus }) {
  return {
    name: action === "confirmed" ? quotationEvents.confirmed : quotationEvents.changed,
    occurredAt: new Date().toISOString(),
    payload: { action, ...payload },
    version: 1
  };
}
