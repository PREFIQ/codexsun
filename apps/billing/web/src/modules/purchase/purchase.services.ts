import { requiredClientEnv } from "../../shared/env/client-env";
import type { Purchase, PurchaseSavePayload, PurchaseStatus } from "./purchase.types";

const API_BASE_URL = requiredClientEnv("VITE_BILLING_API_URL");

type ApiEnvelope<T> = {
  data: T;
  meta: {
    requestId: string;
    timestamp: string;
  };
  success: true;
};

export async function listPurchases() {
  return purchaseRequest<Purchase[]>("/billing/purchase");
}

export async function getPurchase(id: string) {
  return purchaseRequest<Purchase>(`/billing/purchase/${id}`);
}

export async function createPurchase(payload: PurchaseSavePayload) {
  return purchaseRequest<Purchase>("/billing/purchase", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export async function updatePurchase(id: string, payload: PurchaseSavePayload) {
  return purchaseRequest<Purchase>(`/billing/purchase/${id}`, {
    body: JSON.stringify(payload),
    method: "PUT",
  });
}

export async function setPurchaseStatus(id: string, status: Exclude<PurchaseStatus, "draft">) {
  return purchaseRequest<Purchase>(`/billing/purchase/${id}/${status === "confirmed" ? "confirm" : "cancel"}`, {
    method: "POST",
  });
}

export function purchaseToPayload(purchase: Purchase): PurchaseSavePayload {
  return {
    billingAddress: purchase.billingAddress,
    currencyCode: purchase.currencyCode,
    customerEmail: purchase.customerEmail,
    customerName: purchase.customerName,
    customerPhone: purchase.customerPhone,
    invoiceNumber: purchase.invoiceNumber,
    issuedOn: purchase.issuedOn,
    items: purchase.items.map((item) => ({
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
    notes: purchase.notes,
    roundOff: purchase.roundOff,
    shippingAddress: purchase.shippingAddress,
    status: purchase.status,
    supplierBillDate: purchase.supplierBillDate,
    supplierBillNo: purchase.supplierBillNo,
    taxType: purchase.taxType,
    workOrderNo: purchase.workOrderNo,
  };
}

export function formatMoney(value: number, currencyCode = "INR") {
  return new Intl.NumberFormat("en-IN", {
    currency: currencyCode,
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

export function formatDateTime(value: string) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function totalPurchaseQuantity(purchase: Purchase) {
  return purchase.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
}

async function purchaseRequest<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    let message = `Billing API request failed: ${response.status}`;
    try {
      const body = (await response.json()) as { error?: { message?: string } };
      if (body.error?.message) message = body.error.message;
    } catch {
      // Keep the status-based fallback.
    }
    throw new Error(message);
  }

  const envelope = (await response.json()) as ApiEnvelope<T>;
  return envelope.data;
}
