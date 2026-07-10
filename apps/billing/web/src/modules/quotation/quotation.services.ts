import { billingApiGet, billingApiPost, billingApiPut } from "../../shared/api/billing-api";
import { getTenantId, getToken } from "../../shared/api/tenant-context";
import { requiredClientEnv } from "../../shared/env/client-env";
import type { Quotation, QuotationSavePayload, QuotationStatus } from "./quotation.types";

const coreApiBaseUrl = requiredClientEnv("VITE_CORE_API_URL");

type Envelope<T> = { data: T; success: true } | { error: { message: string }; success: false };

export type QuotationLookupOption = {
  description?: string;
  label: string;
  meta?: string;
  record?: QuotationLookupRecord;
  value: string;
};

export type QuotationLookupRecord = {
  code?: string | null;
  description?: string | null;
  hsnCode?: string | null;
  id: string;
  isActive?: boolean | null;
  name?: string | null;
  openingRate?: number | null;
  price?: number | null;
  primaryEmail?: string | null;
  primaryPhone?: string | null;
  taxName?: string | null;
  taxRate?: number | null;
  typeName?: string | null;
  unitName?: string | null;
  workOrderNo?: string | null;
};

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

export function listQuotationContacts() {
  return coreRequest<QuotationLookupRecord[]>("/core/master/contacts").then((records) =>
    records.filter(isActiveRecord).map((record) =>
      lookupOption(record, {
        description: record.primaryPhone || record.primaryEmail || "",
        label: record.name || record.code || record.id,
        meta: record.code || "",
        value: record.name || record.code || record.id,
      }),
    ),
  );
}

export function listQuotationWorkOrders() {
  return coreRequest<QuotationLookupRecord[]>("/core/master/work-orders").then((records) =>
    records.filter(isActiveRecord).map((record) => {
      const workOrderNo = record.code || record.workOrderNo || record.name || record.id;
      return lookupOption(record, {
        description: record.name || record.typeName || "",
        label: workOrderNo,
        meta: record.typeName || "",
        value: workOrderNo,
      });
    }),
  );
}

export function listQuotationProducts() {
  return coreRequest<QuotationLookupRecord[]>("/core/master/products").then((records) =>
    records.filter(isActiveRecord).map((record) =>
      lookupOption(record, {
        description: [record.hsnCode, record.unitName].filter(Boolean).join(" | "),
        label: record.name || record.code || record.id,
        meta: record.code || "",
        value: record.name || record.code || record.id,
      }),
    ),
  );
}

export function listQuotationColours() {
  return listQuotationCommonOptions("/core/common/products/colours");
}

export function listQuotationSizes() {
  return listQuotationCommonOptions("/core/common/products/sizes");
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

async function coreRequest<T>(path: string) {
  const token = getToken("tenant");
  const tenantId = getTenantId();
  const response = await fetch(`${coreApiBaseUrl}${path}`, {
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(tenantId ? { "x-tenant-id": tenantId } : {}),
    },
  });
  const envelope = (await response.json()) as Envelope<T>;
  if (!response.ok || !envelope.success) throw new Error(envelope.success ? "Core API request failed." : envelope.error.message);
  return envelope.data;
}

function listQuotationCommonOptions(path: string) {
  return coreRequest<QuotationLookupRecord[]>(path).then((records) =>
    records.filter(isActiveRecord).map((record) => {
      const label = record.name || record.code || record.id;
      return lookupOption(record, {
        description: record.description || record.code || "",
        label,
        value: label,
      });
    }),
  );
}

function lookupOption(record: QuotationLookupRecord, option: Omit<QuotationLookupOption, "record">): QuotationLookupOption {
  return {
    ...option,
    record,
  };
}

function isActiveRecord(record: QuotationLookupRecord) {
  return record.isActive !== false;
}
