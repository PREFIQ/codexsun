import {
  billingApiDelete,
  billingApiGet,
  billingApiPost,
  billingApiPut
} from "../../shared/api/billing-api";
import type {
  Receipt,
  ReceiptAllocationCandidate,
  ReceiptContext,
  ReceiptLookupOption,
  ReceiptLookupRecord,
  ReceiptSavePayload
} from "./receipt.types";

export const listReceipts = () => billingApiGet<Receipt[]>("/billing/receipts");
export const getReceiptContext = () => billingApiGet<ReceiptContext>("/billing/receipts/context");
export const createReceipt = (input: ReceiptSavePayload) =>
  billingApiPost<Receipt>("/billing/receipts", input);
export const updateReceipt = (id: string, input: ReceiptSavePayload) =>
  billingApiPut<Receipt>(`/billing/receipts/${id}`, input);
export const postReceipt = (id: string) => billingApiPost<Receipt>(`/billing/receipts/${id}/post`);
export const cancelReceipt = (id: string) =>
  billingApiPost<Receipt>(`/billing/receipts/${id}/cancel`);
export const deleteReceipt = (id: string) => billingApiDelete<Receipt>(`/billing/receipts/${id}`);
export const listReceiptAllocations = (customerId: number) =>
  customerId > 0
    ? billingApiGet<ReceiptAllocationCandidate[]>(
        `/billing/receipts/allocations?customerId=${customerId}`
      )
    : Promise.resolve([]);
export const listReceiptContacts = () =>
  billingApiGet<ReceiptLookupRecord[]>("/billing/receipts/lookups/contacts").then((rows) =>
    options(rows, "contact")
  );
export const listReceiptLedgers = () =>
  billingApiGet<ReceiptLookupRecord[]>("/billing/receipts/lookups/ledgers").then((rows) =>
    options(rows, "ledger")
  );
export function formatReceiptMoney(value: number) {
  return new Intl.NumberFormat("en-IN", { currency: "INR", style: "currency" }).format(value);
}
export function formatReceiptDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(
        date
      );
}
function options(rows: ReceiptLookupRecord[], kind: "contact" | "ledger"): ReceiptLookupOption[] {
  return rows
    .filter((row) => row.isActive !== false)
    .map((record) => ({
      description:
        kind === "contact" ? record.primaryPhone || record.primaryEmail || "" : record.code || "",
      label: record.name || record.code || record.id,
      record,
      value: record.id
    }));
}
