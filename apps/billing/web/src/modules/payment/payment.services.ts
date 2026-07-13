import {
  billingApiDelete,
  billingApiGet,
  billingApiPost,
  billingApiPut
} from "../../shared/api/billing-api";
import type {
  Payment,
  PaymentActivity,
  PaymentAllocationCandidate,
  PaymentContext,
  PaymentLookupOption,
  PaymentLookupRecord,
  PaymentSavePayload
} from "./payment.types";

export const listPayments = () => billingApiGet<Payment[]>("/billing/payments");
export const getPaymentContext = () => billingApiGet<PaymentContext>("/billing/payments/context");
export const listPaymentActivity = (id: string) =>
  billingApiGet<PaymentActivity[]>(`/billing/payments/${id}/activity`);
export const createPayment = (input: PaymentSavePayload) =>
  billingApiPost<Payment>("/billing/payments", input);
export const updatePayment = (id: string, input: PaymentSavePayload) =>
  billingApiPut<Payment>(`/billing/payments/${id}`, input);
export const postPayment = (id: string) => billingApiPost<Payment>(`/billing/payments/${id}/post`);
export const cancelPayment = (id: string) =>
  billingApiPost<Payment>(`/billing/payments/${id}/cancel`);
export const deletePayment = (id: string) => billingApiDelete<Payment>(`/billing/payments/${id}`);
export const listPaymentAllocations = (supplierId: number) =>
  supplierId > 0
    ? billingApiGet<PaymentAllocationCandidate[]>(
        `/billing/payments/allocations?supplierId=${supplierId}`
      )
    : Promise.resolve([]);
export const listPaymentContacts = () =>
  billingApiGet<PaymentLookupRecord[]>("/billing/payments/lookups/contacts").then((rows) =>
    options(rows, "contact")
  );
export const listPaymentLedgers = () =>
  billingApiGet<PaymentLookupRecord[]>("/billing/payments/lookups/ledgers").then((rows) =>
    options(rows, "ledger")
  );
export function formatPaymentMoney(value: number) {
  return new Intl.NumberFormat("en-IN", { currency: "INR", style: "currency" }).format(value);
}
export function formatPaymentDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(
        date
      );
}
function options(rows: PaymentLookupRecord[], kind: "contact" | "ledger"): PaymentLookupOption[] {
  return rows
    .filter((row) => row.isActive !== false)
    .map((record) => {
      const value = String(record.id);
      return {
        description:
          kind === "contact" ? record.primaryPhone || record.primaryEmail || "" : record.code || "",
        label: String(record.name || record.code || value),
        record: { ...record, id: value },
        value
      };
    });
}
