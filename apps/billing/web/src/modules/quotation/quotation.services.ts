import { billingApiGet, billingApiPost, billingApiPut } from "../../shared/api/billing-api";
import type { Quotation, QuotationSavePayload, QuotationStatus } from "./quotation.types";

export async function listQuotations() {
  return billingApiGet<Quotation[]>("/billing/quotations");
}

export async function getQuotation(id: string) {
  return billingApiGet<Quotation>(`/billing/quotations/${id}`);
}

export async function createQuotation(payload: QuotationSavePayload) {
  return billingApiPost<Quotation>("/billing/quotations", payload);
}

export async function updateQuotation(id: string, payload: QuotationSavePayload) {
  return billingApiPut<Quotation>(`/billing/quotations/${id}`, payload);
}

export async function setQuotationStatus(id: string, status: Exclude<QuotationStatus, "draft">) {
  return billingApiPost<Quotation>(`/billing/quotations/${id}/${status === "confirmed" ? "confirm" : "cancel"}`);
}

export function quotationToPayload(quotation: Quotation): QuotationSavePayload {
  return {
    billingAddress: quotation.billingAddress,
    customerName: quotation.customerName,
    date: quotation.date,
    items: quotation.items.map((item) => ({
      colour: item.colour,
      dcNo: item.dcNo,
      description: item.description,
      hsnCode: item.hsnCode,
      poNo: item.poNo,
      productName: item.productName,
      quantity: item.quantity,
      rate: item.rate,
      size: item.size,
      taxRate: item.taxRate,
      unit: item.unit,
    })),
    notes: quotation.notes,
    quotationNumber: quotation.quotationNumber,
    roundOff: quotation.roundOff,
    salesLedger: quotation.salesLedger,
    shippingAddress: quotation.shippingAddress,
    status: quotation.status,
    taxType: quotation.taxType,
    terms: quotation.terms,
    workOrderNo: quotation.workOrderNo,
  };
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(Number(value ?? 0));
}

export function formatDate(value: string) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function totalQuotationQuantity(quotation: Quotation) {
  return quotation.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
}

