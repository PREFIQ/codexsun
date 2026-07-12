import {
  billingApiDelete,
  billingApiGet,
  billingApiPost,
  billingApiPut
} from "../../shared/api/billing-api";
import type { Purchase, PurchaseSavePayload, PurchaseStatus } from "./purchase.types";

export type PurchaseLookupOption = {
  description?: string;
  label: string;
  meta?: string;
  record?: PurchaseLookupRecord;
  value: string;
};

export type PurchaseLookupRecord = {
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

export type PurchaseContactSavePayload = {
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

export type PurchaseLocationKind = "cities" | "districts" | "pincodes" | "states";

export type PurchaseLocationRecord = {
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

export type PurchaseMasterSavePayload = {
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

export async function listPurchases() {
  return billingApiGet<Purchase[]>("/billing/purchase").then((records) =>
    records.map(fromApiPurchase)
  );
}

export async function getPurchase(id: string) {
  return billingApiGet<Purchase>(`/billing/purchase/${id}`).then(fromApiPurchase);
}

export async function createPurchase(payload: PurchaseSavePayload) {
  return billingApiPost<Purchase>("/billing/purchase", toApiPayload(payload)).then(fromApiPurchase);
}

export async function updatePurchase(id: string, payload: PurchaseSavePayload) {
  return billingApiPut<Purchase>(`/billing/purchase/${id}`, toApiPayload(payload)).then(
    fromApiPurchase
  );
}

export async function deletePurchase(id: string) {
  return billingApiDelete<Purchase>(`/billing/purchase/${id}`);
}

export async function setPurchaseStatus(id: string, status: Exclude<PurchaseStatus, "draft">) {
  return billingApiPost<Purchase>(
    `/billing/purchase/${id}/${status === "confirmed" ? "confirm" : "cancel"}`
  ).then(fromApiPurchase);
}

export async function revokePurchase(id: string) {
  return billingApiPost<Purchase>(`/billing/purchase/${id}/revoke`).then(fromApiPurchase);
}

export function createPurchaseContact(payload: PurchaseContactSavePayload) {
  return billingApiPost<PurchaseLookupRecord>(
    "/billing/purchase/lookups/contacts",
    contactPayload(payload)
  );
}

export function updatePurchaseContact(id: string, payload: PurchaseContactSavePayload) {
  return billingApiPut<PurchaseLookupRecord>(
    `/billing/purchase/lookups/contacts/${id}`,
    contactPayload(payload)
  );
}

export function listPurchaseLocations(
  kind: "cities" | "countries" | "districts" | "pincodes" | "states"
) {
  return billingApiGet<PurchaseLocationRecord[]>(`/billing/purchase/lookups/${kind}`);
}

export function createPurchaseLocation(
  kind: PurchaseLocationKind,
  payload: Record<string, unknown>
) {
  return billingApiPost<PurchaseLocationRecord>(
    `/billing/purchase/lookups/locations/${kind}`,
    payload
  );
}

export function listPurchaseAddressTypes() {
  return billingApiGet<PurchaseLookupRecord[]>("/billing/purchase/lookups/addressTypes");
}

export function createPurchaseAddressType(name: string) {
  return billingApiPost<PurchaseLookupRecord>("/billing/purchase/lookups/address-types", {
    isActive: true,
    name: name.trim()
  });
}

export function createPurchaseLookup(
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
  return billingApiPost<PurchaseLookupRecord>(`/billing/purchase/lookups/${kind}`, payload);
}

export function listPurchaseProductCategories() {
  return billingApiGet<PurchaseLookupRecord[]>("/billing/purchase/lookups/productCategories");
}

export function listPurchaseHsnCodes() {
  return billingApiGet<PurchaseLookupRecord[]>("/billing/purchase/lookups/hsnCodes");
}

export function listPurchaseUnits() {
  return billingApiGet<PurchaseLookupRecord[]>("/billing/purchase/lookups/units");
}

export function listPurchaseTaxes() {
  return billingApiGet<PurchaseLookupRecord[]>("/billing/purchase/lookups/taxes");
}

export function updatePurchaseLookup(
  kind: "products" | "workOrders",
  id: string,
  payload: Record<string, unknown>
) {
  return billingApiPut<PurchaseLookupRecord>(`/billing/purchase/lookups/${kind}/${id}`, payload);
}

export function listPurchaseContacts() {
  return billingApiGet<PurchaseLookupRecord[]>("/billing/purchase/lookups/contacts").then(
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

export function listPurchaseWorkOrders() {
  return billingApiGet<PurchaseLookupRecord[]>("/billing/purchase/lookups/workOrders").then(
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

export function listPurchaseProducts() {
  return billingApiGet<PurchaseLookupRecord[]>("/billing/purchase/lookups/products").then(
    (records) =>
      records.filter(isActiveRecord).map((record) =>
        lookupOption(record, {
          label: record.name || record.code || record.id,
          value: record.name || record.code || record.id
        })
      )
  );
}

export function listPurchaseColours() {
  return listPurchaseCommonOptions("colours");
}

export function listPurchaseSizes() {
  return listPurchaseCommonOptions("sizes");
}

export function purchaseToPayload(purchase: Purchase): PurchaseSavePayload {
  return {
    billingAddress: purchase.billingAddress,
    currencyCode: purchase.currencyCode,
    customerEmail: purchase.customerEmail,
    customerName: purchase.customerName,
    customerPhone: purchase.customerPhone,
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
      unit: item.unit
    })),
    notes: purchase.notes,
    invoiceNumber: purchase.invoiceNumber,
    roundOff: purchase.roundOff,
    supplierBillDate: purchase.supplierBillDate,
    supplierBillNo: purchase.supplierBillNo,
    shippingAddress: purchase.shippingAddress,
    status: purchase.status,
    taxType: purchase.taxType,
    terms: purchase.terms,
    workOrderNo: purchase.workOrderNo
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

export function totalPurchaseQuantity(purchase: Purchase) {
  return purchase.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
}

function listPurchaseCommonOptions(kind: "colours" | "sizes") {
  return billingApiGet<PurchaseLookupRecord[]>(`/billing/purchase/lookups/${kind}`).then(
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
  record: PurchaseLookupRecord,
  option: Omit<PurchaseLookupOption, "record">
): PurchaseLookupOption {
  return {
    ...option,
    record
  };
}

function isActiveRecord(record: PurchaseLookupRecord) {
  return record.isActive !== false;
}

function toApiPayload(payload: PurchaseSavePayload) {
  return {
    billingAddress: payload.billingAddress,
    currencyCode: payload.currencyCode || "INR",
    customerEmail: payload.customerEmail,
    customerName: payload.customerName,
    customerPhone: payload.customerPhone,
    invoiceNumber: payload.invoiceNumber || "",
    issuedOn: payload.issuedOn,
    items: payload.items,
    notes: payload.notes,
    roundOff: payload.roundOff,
    shippingAddress: payload.shippingAddress,
    status: payload.status,
    supplierBillDate: payload.supplierBillDate,
    supplierBillNo: payload.supplierBillNo,
    taxType: payload.taxType === "igst" ? "IGST" : "CGST + SGST",
    terms: payload.terms,
    workOrderNo: payload.workOrderNo
  };
}

function fromApiPurchase(record: Purchase): Purchase {
  const invoiceNumber = record.invoiceNumber || "";
  return {
    ...record,
    currencyCode: record.currencyCode || "INR",
    customerEmail: record.customerEmail || "",
    customerPhone: record.customerPhone || "",
    invoiceNumber,
    taxType: String(record.taxType || "CGST + SGST")
      .toLowerCase()
      .includes("igst")
      ? "igst"
      : "cgst-sgst",
    terms: record.terms || "",
    workOrderNo: record.workOrderNo || ""
  };
}

function contactPayload(payload: PurchaseContactSavePayload) {
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
