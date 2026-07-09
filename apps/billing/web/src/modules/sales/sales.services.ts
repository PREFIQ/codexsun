import { requiredClientEnv } from "../../shared/env/client-env";
import type { Sale, SaleSavePayload, SaleStatus } from "./sales.types";

const API_BASE_URL = requiredClientEnv("VITE_BILLING_API_URL");

type ApiEnvelope<T> = {
  data: T;
  meta: {
    requestId: string;
    timestamp: string;
  };
  success: true;
};

export async function listSales() {
  return salesRequest<Sale[]>("/billing/sales");
}

export async function getSale(id: string) {
  return salesRequest<Sale>(`/billing/sales/${id}`);
}

export async function createSale(payload: SaleSavePayload) {
  return salesRequest<Sale>("/billing/sales", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export async function updateSale(id: string, payload: SaleSavePayload) {
  return salesRequest<Sale>(`/billing/sales/${id}`, {
    body: JSON.stringify(payload),
    method: "PUT",
  });
}

export async function setSaleStatus(id: string, status: Exclude<SaleStatus, "draft">) {
  return salesRequest<Sale>(`/billing/sales/${id}/${status === "confirmed" ? "confirm" : "cancel"}`, {
    method: "POST",
  });
}

export function saleToPayload(sale: Sale): SaleSavePayload {
  return {
    billingAddress: sale.billingAddress,
    currencyCode: sale.currencyCode,
    customerEmail: sale.customerEmail,
    customerName: sale.customerName,
    customerPhone: sale.customerPhone,
    invoiceNumber: sale.invoiceNumber,
    issuedOn: sale.issuedOn,
    items: sale.items.map((item) => ({
      colour: item.colour,
      dcNo: item.dcNo,
      description: item.description,
      hsnCode: item.hsnCode,
      poNo: item.poNo,
      quantity: item.quantity,
      rate: item.rate,
      size: item.size,
      taxRate: item.taxRate,
      unit: item.unit,
    })),
    notes: sale.notes,
    roundOff: sale.roundOff,
    shippingAddress: sale.shippingAddress,
    status: sale.status,
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

export function totalSaleQuantity(sale: Sale) {
  return sale.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
}

async function salesRequest<T>(path: string, init?: RequestInit) {
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
