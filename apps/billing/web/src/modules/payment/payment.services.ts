import { billingApiDelete, billingApiGet, billingApiPost, billingApiPut } from "../../shared/api/billing-api";
import type { Payment, PaymentInput, PaymentStatus } from "./payment.types";
export const listPayments = () => billingApiGet<Payment[]>("/billing/payments");
export const createPayment = (input: PaymentInput) => billingApiPost<Payment>("/billing/payments", input);
export const updatePayment = (id: string, input: PaymentInput) => billingApiPut<Payment>(`/billing/payments/${id}`, input);
export const setPaymentStatus = (id: string, status: PaymentStatus) => billingApiPost<Payment>(`/billing/payments/${id}/status`, { status });
export const deletePayment = (id: string) => billingApiDelete<Payment>(`/billing/payments/${id}`);
