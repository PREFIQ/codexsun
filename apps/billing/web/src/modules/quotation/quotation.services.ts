import {
  billingApiDelete,
  billingApiGet,
  billingApiPost,
  billingApiPut
} from "../../shared/api/billing-api";
import type { Quotation, QuotationSavePayload, QuotationStatus } from "./quotation.types";
import type { Sale } from "../sales/sales.types";

export type QuotationLookupOption = {
  description?: string;
  label: string;
  meta?: string;
  record?: QuotationLookupRecord;
  value: string;
};

export type QuotationLookupRecord = {
  addresses?: Array<Record<string, unknown>>;
  code?: string | null;
  description?: string | null;
  gstin?: string | null;
  hsnCode?: string | null;
  id: string;
  isActive?: boolean | null;
  legalName?: string | null;
  name?: string | null;
  openingRate?: number | null;
  productCategoryId?: string | null;
  productCategoryName?: string | null;
  price?: number | null;
  primaryEmail?: string | null;
  primaryPhone?: string | null;
  taxName?: string | null;
  taxRate?: number | null;
  ratePercent?: number | null;
  unitId?: string | null;
  hsnCodeId?: string | null;
  taxId?: string | null;
  typeName?: string | null;
  unitName?: string | null;
  workOrderNo?: string | null;
};

export type QuotationContactSavePayload = {
  addressTypeName: string;
  addressLine1: string;
  addressLine2: string;
  cityId: string;
  cityName: string;
  countryId: string;
  countryName: string;
  districtId: string;
  districtName: string;
  gstin: string;
  legalName: string;
  name: string;
  pincodeId: string;
  pincodeName: string;
  primaryEmail: string;
  primaryPhone: string;
  stateId: string;
  stateName: string;
};

export type QuotationLocationKind = "cities" | "districts" | "pincodes" | "states";

export type QuotationLocationRecord = {
  areaName?: string | null;
  cityId?: string | null;
  cityName?: string | null;
  code: string;
  countryId?: string | null;
  countryName?: string | null;
  districtId?: string | null;
  districtName?: string | null;
  id: string;
  name: string;
  pincode?: string | null;
  stateId?: string | null;
  stateName?: string | null;
  status?: "active" | "inactive";
};

export type QuotationMasterSavePayload = {
  code: string;
  hsnCode: string;
  hsnCodeId?: string;
  name: string;
  openingRate: number;
  productCategoryId?: string;
  productCategoryName?: string;
  taxId?: string;
  taxName?: string;
  taxRate?: number;
  typeName: string;
  unitId?: string;
  unitName: string;
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

export async function deleteQuotation(id: string) {
  return billingApiDelete<Quotation>(`/billing/quotations/${id}`);
}

export async function setQuotationStatus(id: string, status: Exclude<QuotationStatus, "draft">) {
  return billingApiPost<Quotation>(
    `/billing/quotations/${id}/${status === "confirmed" ? "confirm" : "cancel"}`
  );
}

export async function revokeQuotation(id: string) {
  return billingApiPost<Quotation>(`/billing/quotations/${id}/revoke`);
}

export async function convertQuotationToSale(id: string) {
  return billingApiPost<{ quotation: Quotation; sale: Sale }>(
    `/billing/quotations/${id}/convert-to-sale`
  );
}

export async function convertQuotationsToSale(ids: string[]) {
  return billingApiPost<{ quotations: Quotation[]; sale: Sale }>(
    "/billing/quotations/convert-to-sale",
    { quotationIds: ids }
  );
}

export function createQuotationContact(payload: QuotationContactSavePayload) {
  return billingApiPost<QuotationLookupRecord>(
    "/billing/quotations/lookups/contacts",
    contactPayload(payload)
  );
}

export function updateQuotationContact(id: string, payload: QuotationContactSavePayload) {
  return billingApiPut<QuotationLookupRecord>(
    `/billing/quotations/lookups/contacts/${id}`,
    contactPayload(payload)
  );
}

export function listQuotationLocations(
  kind: "cities" | "countries" | "districts" | "pincodes" | "states"
) {
  return billingApiGet<QuotationLocationRecord[]>(`/billing/quotations/lookups/${kind}`);
}

export function createQuotationLocation(
  kind: QuotationLocationKind,
  payload: Record<string, unknown>
) {
  return billingApiPost<QuotationLocationRecord>(
    `/billing/quotations/lookups/locations/${kind}`,
    payload
  );
}

export function listQuotationAddressTypes() {
  return billingApiGet<QuotationLookupRecord[]>("/billing/quotations/lookups/addressTypes");
}

export function createQuotationAddressType(name: string) {
  return billingApiPost<QuotationLookupRecord>("/billing/quotations/lookups/address-types", {
    isActive: true,
    name: name.trim()
  });
}

export function createQuotationLookup(
  kind:
    | "colours"
    | "products"
    | "sizes"
    | "workOrders"
    | "productCategories"
    | "hsnCodes"
    | "units"
    | "taxes",
  payload: Record<string, unknown>
) {
  return billingApiPost<QuotationLookupRecord>(`/billing/quotations/lookups/${kind}`, payload);
}

export function listQuotationProductCategories() {
  return billingApiGet<QuotationLookupRecord[]>("/billing/quotations/lookups/productCategories");
}

export function listQuotationHsnCodes() {
  return billingApiGet<QuotationLookupRecord[]>("/billing/quotations/lookups/hsnCodes");
}

export function listQuotationUnits() {
  return billingApiGet<QuotationLookupRecord[]>("/billing/quotations/lookups/units");
}

export function listQuotationTaxes() {
  return billingApiGet<QuotationLookupRecord[]>("/billing/quotations/lookups/taxes");
}

export function updateQuotationLookup(
  kind: "products" | "workOrders",
  id: string,
  payload: Record<string, unknown>
) {
  return billingApiPut<QuotationLookupRecord>(`/billing/quotations/lookups/${kind}/${id}`, payload);
}

export function listQuotationContacts() {
  return billingApiGet<QuotationLookupRecord[]>("/billing/quotations/lookups/contacts").then(
    (records) =>
      records.filter(isActiveRecord).map((record) =>
        lookupOption(record, {
          description: record.primaryPhone || record.primaryEmail || "",
          label: record.name || record.code || record.id,
          meta: record.code || "",
          value: record.name || record.code || record.id
        })
      )
  );
}

export function listQuotationWorkOrders() {
  return billingApiGet<QuotationLookupRecord[]>("/billing/quotations/lookups/workOrders").then(
    (records) =>
      records.filter(isActiveRecord).map((record) => {
        const workOrderNo = record.code || record.workOrderNo || record.name || record.id;
        return lookupOption(record, {
          description: record.name || record.typeName || "",
          label: workOrderNo,
          meta: record.typeName || "",
          value: workOrderNo
        });
      })
  );
}

export function listQuotationProducts() {
  return billingApiGet<QuotationLookupRecord[]>("/billing/quotations/lookups/products").then(
    (records) =>
      records.filter(isActiveRecord).map((record) =>
        lookupOption(record, {
          label: record.name || record.code || record.id,
          value: record.name || record.code || record.id
        })
      )
  );
}

export function listQuotationColours() {
  return listQuotationCommonOptions("colours");
}

export function listQuotationSizes() {
  return listQuotationCommonOptions("sizes");
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
      unit: item.unit
    })),
    notes: quotation.notes,
    quotationNumber: quotation.quotationNumber,
    roundOff: quotation.roundOff,
    salesLedger: quotation.salesLedger,
    shippingAddress: quotation.shippingAddress,
    status: quotation.status,
    taxType: quotation.taxType,
    terms: quotation.terms,
    workOrderNo: quotation.workOrderNo
  };
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency"
  }).format(Number(value ?? 0));
}

export function formatDate(value: string) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
}

export function totalQuotationQuantity(quotation: Quotation) {
  return quotation.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
}

function listQuotationCommonOptions(kind: "colours" | "sizes") {
  return billingApiGet<QuotationLookupRecord[]>(`/billing/quotations/lookups/${kind}`).then(
    (records) =>
      records.filter(isActiveRecord).map((record) => {
        const label = record.name || record.code || record.id;
        return lookupOption(record, {
          description: record.description || record.code || "",
          label,
          value: label
        });
      })
  );
}

function lookupOption(
  record: QuotationLookupRecord,
  option: Omit<QuotationLookupOption, "record">
): QuotationLookupOption {
  return {
    ...option,
    record
  };
}

function isActiveRecord(record: QuotationLookupRecord) {
  return record.isActive !== false;
}

function contactPayload(payload: QuotationContactSavePayload) {
  return {
    addresses:
      payload.addressLine1.trim() ||
      payload.addressLine2.trim() ||
      payload.stateId ||
      payload.districtId ||
      payload.cityId ||
      payload.pincodeId
        ? [
            {
              addressLine1: payload.addressLine1.trim(),
              addressLine2: payload.addressLine2.trim(),
              addressTypeName: payload.addressTypeName.trim() || "Billing",
              cityId: payload.cityId || null,
              cityName: payload.cityName || null,
              countryId: payload.countryId || null,
              countryName: payload.countryName || "India",
              districtId: payload.districtId || null,
              districtName: payload.districtName || null,
              isDefault: true,
              pincodeId: payload.pincodeId || null,
              pincodeName: payload.pincodeName || null,
              stateId: payload.stateId || null,
              stateName: payload.stateName || null
            }
          ]
        : [],
    gstin: payload.gstin.trim().toUpperCase(),
    isActive: true,
    legalName: payload.legalName.trim(),
    name: payload.name.trim(),
    primaryEmail: payload.primaryEmail.trim(),
    primaryPhone: payload.primaryPhone.trim()
  };
}
