import {
  billingApiDelete,
  billingApiGet,
  billingApiPost,
  billingApiPut
} from "../../shared/api/billing-api";
import {
  createEmptySaleEinvoice,
  createEmptySaleEway,
  type Sale,
  type SaleSavePayload,
  type SaleStatus
} from "./sales.types";

export type SaleLookupOption = {
  description?: string;
  label: string;
  meta?: string;
  record?: SaleLookupRecord;
  value: string;
};

export type SaleLookupRecord = {
  addresses?: Array<Record<string, unknown>>;
  code?: string | null;
  description?: string | null;
  gst?: string | null;
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
  vehicleNo?: string | null;
  workOrderNo?: string | null;
};

export type SaleContactSavePayload = {
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

export type SaleLocationKind = "cities" | "districts" | "pincodes" | "states";

export type SaleLocationRecord = {
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

export type SaleMasterSavePayload = {
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

export type SaleTransportSavePayload = {
  address: string;
  contactNo: string;
  contactPerson: string;
  gst: string;
  name: string;
  vehicleNo: string;
};

export async function listSales() {
  return billingApiGet<Sale[]>("/billing/sales").then((records) => records.map(fromApiSale));
}

export async function getSale(id: string) {
  return billingApiGet<Sale>(`/billing/sales/${id}`).then(fromApiSale);
}

export async function createSale(payload: SaleSavePayload) {
  return billingApiPost<Sale>("/billing/sales", toApiPayload(payload)).then(fromApiSale);
}

export async function updateSale(id: string, payload: SaleSavePayload) {
  return billingApiPut<Sale>(`/billing/sales/${id}`, toApiPayload(payload)).then(fromApiSale);
}

export async function deleteSale(id: string) {
  return billingApiDelete<Sale>(`/billing/sales/${id}`);
}

export async function setSaleStatus(id: string, status: Exclude<SaleStatus, "draft">) {
  return billingApiPost<Sale>(
    `/billing/sales/${id}/${status === "confirmed" ? "confirm" : "cancel"}`
  ).then(fromApiSale);
}

export async function revokeSale(id: string) {
  return billingApiPost<Sale>(`/billing/sales/${id}/revoke`).then(fromApiSale);
}

export async function generateSaleEinvoice(id: string, einvoice?: Sale["einvoice"]) {
  return billingApiPost<Sale>(`/billing/sales/${id}/einvoice/generate`, { einvoice }).then(
    fromApiSale
  );
}

export async function generateSaleEway(id: string, eway?: Sale["eway"]) {
  return billingApiPost<Sale>(`/billing/sales/${id}/eway/generate`, { eway }).then(fromApiSale);
}

export function createSaleContact(payload: SaleContactSavePayload) {
  return billingApiPost<SaleLookupRecord>(
    "/billing/sales/lookups/contacts",
    contactPayload(payload)
  );
}

export function updateSaleContact(id: string, payload: SaleContactSavePayload) {
  return billingApiPut<SaleLookupRecord>(
    `/billing/sales/lookups/contacts/${id}`,
    contactPayload(payload)
  );
}

export function listSaleLocations(
  kind: "cities" | "countries" | "districts" | "pincodes" | "states"
) {
  return billingApiGet<SaleLocationRecord[]>(`/billing/sales/lookups/${kind}`);
}

export function createSaleLocation(kind: SaleLocationKind, payload: Record<string, unknown>) {
  return billingApiPost<SaleLocationRecord>(`/billing/sales/lookups/locations/${kind}`, payload);
}

export function listSaleAddressTypes() {
  return billingApiGet<SaleLookupRecord[]>("/billing/sales/lookups/addressTypes");
}

export function createSaleAddressType(name: string) {
  return billingApiPost<SaleLookupRecord>("/billing/sales/lookups/address-types", {
    isActive: true,
    name: name.trim()
  });
}

export function createSaleLookup(
  kind:
    | "colours"
    | "products"
    | "sizes"
    | "workOrders"
    | "productCategories"
    | "hsnCodes"
    | "units"
    | "taxes"
    | "transports",
  payload: Record<string, unknown>
) {
  return billingApiPost<SaleLookupRecord>(`/billing/sales/lookups/${kind}`, payload);
}

export function listSaleProductCategories() {
  return billingApiGet<SaleLookupRecord[]>("/billing/sales/lookups/productCategories");
}

export function listSaleHsnCodes() {
  return billingApiGet<SaleLookupRecord[]>("/billing/sales/lookups/hsnCodes");
}

export function listSaleUnits() {
  return billingApiGet<SaleLookupRecord[]>("/billing/sales/lookups/units");
}

export function listSaleTaxes() {
  return billingApiGet<SaleLookupRecord[]>("/billing/sales/lookups/taxes");
}

export function updateSaleLookup(
  kind: "products" | "workOrders",
  id: string,
  payload: Record<string, unknown>
) {
  return billingApiPut<SaleLookupRecord>(`/billing/sales/lookups/${kind}/${id}`, payload);
}

export function listSaleContacts() {
  return billingApiGet<SaleLookupRecord[]>("/billing/sales/lookups/contacts").then((records) =>
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

export function listSaleWorkOrders() {
  return billingApiGet<SaleLookupRecord[]>("/billing/sales/lookups/workOrders").then((records) =>
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

export function listSaleProducts() {
  return billingApiGet<SaleLookupRecord[]>("/billing/sales/lookups/products").then((records) =>
    records.filter(isActiveRecord).map((record) =>
      lookupOption(record, {
        label: record.name || record.code || record.id,
        value: record.name || record.code || record.id
      })
    )
  );
}

export function listSaleColours() {
  return listSaleCommonOptions("colours");
}

export function listSaleSizes() {
  return listSaleCommonOptions("sizes");
}

export function listSaleTransports() {
  return billingApiGet<SaleLookupRecord[]>("/billing/sales/lookups/transports").then((records) =>
    records.filter(isActiveRecord).map((record) =>
      lookupOption(record, {
        description: record.gst || record.vehicleNo || "",
        label: record.name || record.code || record.id,
        meta: record.gst || "",
        value: record.name || record.code || record.id
      })
    )
  );
}

export function createSaleTransport(payload: SaleTransportSavePayload) {
  return createSaleLookup("transports", { ...payload, isActive: true });
}

export function saleToPayload(sale: Sale): SaleSavePayload {
  return {
    billingAddress: sale.billingAddress,
    customerEmail: sale.customerEmail,
    customerName: sale.customerName,
    customerPhone: sale.customerPhone,
    einvoice: sale.einvoice ?? createEmptySaleEinvoice(),
    issuedOn: sale.issuedOn,
    items: sale.items.map((item) => ({
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
    notes: sale.notes,
    saleNumber: sale.saleNumber || sale.invoiceNumber,
    roundOff: sale.roundOff,
    salesLedger: sale.salesLedger,
    shippingAddress: sale.shippingAddress,
    status: sale.status,
    taxType: sale.taxType,
    terms: sale.terms,
    workOrderNo: sale.workOrderNo,
    eway: sale.eway ?? createEmptySaleEway()
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

export function totalSaleQuantity(sale: Sale) {
  return sale.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
}

function listSaleCommonOptions(kind: "colours" | "sizes") {
  return billingApiGet<SaleLookupRecord[]>(`/billing/sales/lookups/${kind}`).then((records) =>
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
  record: SaleLookupRecord,
  option: Omit<SaleLookupOption, "record">
): SaleLookupOption {
  return {
    ...option,
    record
  };
}

function isActiveRecord(record: SaleLookupRecord) {
  return record.isActive !== false;
}

function toApiPayload(payload: SaleSavePayload) {
  return {
    billingAddress: payload.billingAddress,
    currencyCode: payload.currencyCode || "INR",
    customerEmail: payload.customerEmail,
    customerName: payload.customerName,
    customerPhone: payload.customerPhone,
    einvoice: payload.einvoice,
    invoiceNumber: payload.invoiceNumber || payload.saleNumber || "",
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
    eway: payload.eway
  };
}

function fromApiSale(record: Sale): Sale {
  const invoiceNumber = record.invoiceNumber || record.saleNumber || "";
  return {
    ...record,
    currencyCode: record.currencyCode || "INR",
    customerEmail: record.customerEmail || "",
    customerPhone: record.customerPhone || "",
    einvoice: record.einvoice ?? createEmptySaleEinvoice(),
    invoiceNumber,
    saleNumber: record.saleNumber || invoiceNumber,
    salesLedger: record.salesLedger || "",
    taxType: record.taxType || "cgst-sgst",
    terms: record.terms || "",
    workOrderNo: record.workOrderNo || "",
    eway: record.eway ?? createEmptySaleEway()
  };
}

function contactPayload(payload: SaleContactSavePayload) {
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
