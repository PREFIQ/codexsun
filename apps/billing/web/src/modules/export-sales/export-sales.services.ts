import { billingApiDelete, billingApiGet, billingApiPost, billingApiPut } from "../../shared/api/billing-api";
import type { ExportSale, ExportSaleSavePayload, ExportSaleStatus } from "./export-sales.types";

export type ExportSaleLookupOption = {
  description?: string;
  label: string;
  meta?: string;
  record?: ExportSaleLookupRecord;
  value: string;
};

export type ExportSaleLookupRecord = {
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

export type ExportSaleContactSavePayload = {
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

export type ExportSaleLocationKind = "cities" | "districts" | "pincodes" | "states";

export type ExportSaleLocationRecord = {
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

export type ExportSaleMasterSavePayload = {
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

export async function listExportSales() {
  return billingApiGet<ExportSale[]>("/billing/export-sales").then((records) => records.map(fromApiExportSale));
}

export async function getExportSale(id: string) {
  return billingApiGet<ExportSale>(`/billing/export-sales/${id}`).then(fromApiExportSale);
}

export async function createExportSale(payload: ExportSaleSavePayload) {
  return billingApiPost<ExportSale>("/billing/export-sales", toApiPayload(payload)).then(fromApiExportSale);
}

export async function updateExportSale(id: string, payload: ExportSaleSavePayload) {
  return billingApiPut<ExportSale>(`/billing/export-sales/${id}`, toApiPayload(payload)).then(fromApiExportSale);
}

export async function deleteExportSale(id: string) {
  return billingApiDelete<ExportSale>(`/billing/export-sales/${id}`);
}

export async function setExportSaleStatus(id: string, status: Exclude<ExportSaleStatus, "draft">) {
  return billingApiPost<ExportSale>(`/billing/export-sales/${id}/${status === "confirmed" ? "confirm" : "cancel"}`).then(fromApiExportSale);
}

export async function revokeExportSale(id: string) {
  return billingApiPost<ExportSale>(`/billing/export-sales/${id}/revoke`).then(fromApiExportSale);
}

export function createExportSaleContact(payload: ExportSaleContactSavePayload) {
  return billingApiPost<ExportSaleLookupRecord>("/billing/export-sales/lookups/contacts", contactPayload(payload));
}

export function updateExportSaleContact(id: string, payload: ExportSaleContactSavePayload) {
  return billingApiPut<ExportSaleLookupRecord>(`/billing/export-sales/lookups/contacts/${id}`, contactPayload(payload));
}

export function listExportSaleLocations(kind: "cities" | "countries" | "districts" | "pincodes" | "states") {
  return billingApiGet<ExportSaleLocationRecord[]>(`/billing/export-sales/lookups/${kind}`);
}

export function createExportSaleLocation(kind: ExportSaleLocationKind, payload: Record<string, unknown>) {
  return billingApiPost<ExportSaleLocationRecord>(`/billing/export-sales/lookups/locations/${kind}`, payload);
}

export function listExportSaleAddressTypes() {
  return billingApiGet<ExportSaleLookupRecord[]>("/billing/export-sales/lookups/addressTypes");
}

export function createExportSaleAddressType(name: string) {
  return billingApiPost<ExportSaleLookupRecord>("/billing/export-sales/lookups/address-types", { isActive: true, name: name.trim() });
}

export function createExportSaleLookup(kind: "colours" | "products" | "sizes" | "workOrders" | "productCategories" | "hsnCodes" | "units" | "taxes", payload: Record<string, unknown>) {
  return billingApiPost<ExportSaleLookupRecord>(`/billing/export-sales/lookups/${kind}`, payload);
}

export function listExportSaleProductCategories() {
  return billingApiGet<ExportSaleLookupRecord[]>("/billing/export-sales/lookups/productCategories");
}

export function listExportSaleHsnCodes() {
  return billingApiGet<ExportSaleLookupRecord[]>("/billing/export-sales/lookups/hsnCodes");
}

export function listExportSaleUnits() {
  return billingApiGet<ExportSaleLookupRecord[]>("/billing/export-sales/lookups/units");
}

export function listExportSaleTaxes() {
  return billingApiGet<ExportSaleLookupRecord[]>("/billing/export-sales/lookups/taxes");
}

export function updateExportSaleLookup(kind: "products" | "workOrders", id: string, payload: Record<string, unknown>) {
  return billingApiPut<ExportSaleLookupRecord>(`/billing/export-sales/lookups/${kind}/${id}`, payload);
}

export function listExportSaleContacts() {
  return billingApiGet<ExportSaleLookupRecord[]>("/billing/export-sales/lookups/contacts").then((records) =>
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

export function listExportSaleWorkOrders() {
  return billingApiGet<ExportSaleLookupRecord[]>("/billing/export-sales/lookups/workOrders").then((records) =>
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

export function listExportSaleProducts() {
  return billingApiGet<ExportSaleLookupRecord[]>("/billing/export-sales/lookups/products").then((records) =>
    records.filter(isActiveRecord).map((record) =>
      lookupOption(record, {
        label: record.name || record.code || record.id,
        value: record.name || record.code || record.id,
      }),
    ),
  );
}

export function listExportSaleColours() {
  return listExportSaleCommonOptions("colours");
}

export function listExportSaleSizes() {
  return listExportSaleCommonOptions("sizes");
}

export function exportSaleToPayload(exportSale: ExportSale): ExportSaleSavePayload {
  return {
    billingAddress: exportSale.billingAddress,
    customerEmail: exportSale.customerEmail,
    customerName: exportSale.customerName,
    customerPhone: exportSale.customerPhone,
    issuedOn: exportSale.issuedOn,
    items: exportSale.items.map((item) => ({
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
    notes: exportSale.notes,
    invoiceNumber: exportSale.invoiceNumber || exportSale.invoiceNumber,
    roundOff: exportSale.roundOff,
    salesLedger: exportSale.salesLedger,
    shippingAddress: exportSale.shippingAddress,
    status: exportSale.status,
    taxType: exportSale.taxType,
    terms: exportSale.terms,
    workOrderNo: exportSale.workOrderNo,
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

export function totalExportSaleQuantity(exportSale: ExportSale) {
  return exportSale.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
}

function listExportSaleCommonOptions(kind: "colours" | "sizes") {
  return billingApiGet<ExportSaleLookupRecord[]>(`/billing/export-sales/lookups/${kind}`).then((records) =>
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

function lookupOption(record: ExportSaleLookupRecord, option: Omit<ExportSaleLookupOption, "record">): ExportSaleLookupOption {
  return {
    ...option,
    record,
  };
}

function isActiveRecord(record: ExportSaleLookupRecord) {
  return record.isActive !== false;
}

function toApiPayload(payload: ExportSaleSavePayload) {
  return {
    billingAddress: payload.billingAddress,
    currencyCode: payload.currencyCode || "INR",
    customerEmail: payload.customerEmail,
    customerName: payload.customerName,
    customerPhone: payload.customerPhone,
    invoiceNumber: payload.invoiceNumber || payload.invoiceNumber || "",
    issuedOn: payload.issuedOn,
    items: payload.items,
    notes: payload.notes,
    roundOff: payload.roundOff,
    salesLedger: payload.salesLedger,
    shippingAddress: payload.shippingAddress,
    status: payload.status,
    taxType: payload.taxType,
    terms: payload.terms,
    workOrderNo: payload.workOrderNo,
  };
}

function fromApiExportSale(record: ExportSale): ExportSale {
  const invoiceNumber = record.invoiceNumber || "";
  return {
    ...record,
    currencyCode: record.currencyCode || "INR",
    customerEmail: record.customerEmail || "",
    customerPhone: record.customerPhone || "",
    invoiceNumber,
    salesLedger: record.salesLedger || "",
    taxType: record.taxType || "cgst-sgst",
    terms: record.terms || "",
    workOrderNo: record.workOrderNo || "",
  };
}

function contactPayload(payload: ExportSaleContactSavePayload) {
  return {
    addresses: payload.addressLine1.trim() || payload.addressLine2.trim() || payload.stateId || payload.districtId || payload.cityId || payload.pincodeId
      ? [{
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
          stateName: payload.stateName || null,
        }]
      : [],
    gstin: payload.gstin.trim().toUpperCase(),
    isActive: true,
    legalName: payload.legalName.trim(),
    name: payload.name.trim(),
    primaryEmail: payload.primaryEmail.trim(),
    primaryPhone: payload.primaryPhone.trim(),
  };
}
