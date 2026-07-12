import {
  billingApiDelete,
  billingApiGet,
  billingApiPost,
  billingApiPut
} from "../../shared/api/billing-api";
import type { Receipt, ReceiptInput, ReceiptStatus } from "./receipt.types";
export const listReceipts = () => billingApiGet<Receipt[]>("/billing/receipts");
export const createReceipt = (input: ReceiptInput) =>
  billingApiPost<Receipt>("/billing/receipts", input);
export const updateReceipt = (id: string, input: ReceiptInput) =>
  billingApiPut<Receipt>(`/billing/receipts/${id}`, input);
export const setReceiptStatus = (id: string, status: ReceiptStatus) =>
  billingApiPost<Receipt>(`/billing/receipts/${id}/status`, { status });
export const deleteReceipt = (id: string) => billingApiDelete<Receipt>(`/billing/receipts/${id}`);
