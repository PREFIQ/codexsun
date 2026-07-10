export type PurchaseStatus = "draft" | "confirmed" | "cancelled";
export type PurchaseTaxType = "cgst-sgst" | "igst";

export type PurchaseLineItemInput = {
  colour: string;
  dcNo: string;
  description: string;
  hsnCode: string;
  poNo: string;
  productName: string;
  quantity: number;
  rate: number;
  size: string;
  taxRate: number;
  unit: string;
};

export type PurchaseLineItem = PurchaseLineItemInput & {
  cgstAmount: number;
  id: string;
  igstAmount: number;
  lineTotal: number;
  sgstAmount: number;
  taxableAmount: number;
  taxAmount: number;
};

export type Purchase = {
  amount: number;
  billingAddress: string;
  createdAt: string;
  currencyCode: string;
  generatedSalesInvoiceNo?: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  id: string;
  invoiceNumber: string;
  issuedOn: string;
  items: PurchaseLineItem[];
  notes: string;
  roundOff: number;
  shippingAddress: string;
  status: PurchaseStatus;
  subtotal: number;
  supplierBillDate: string;
  supplierBillNo: string;
  taxAmount: number;
  taxType: PurchaseTaxType;
  terms: string;
  updatedAt: string;
  workOrderNo: string;
};

export type PurchaseSavePayload = {
  billingAddress: string;
  currencyCode?: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  invoiceNumber: string;
  issuedOn: string;
  items: PurchaseLineItemInput[];
  notes: string;
  roundOff?: number;
  shippingAddress: string;
  status: PurchaseStatus;
  supplierBillDate?: string;
  supplierBillNo?: string;
  taxType: PurchaseTaxType;
  terms: string;
  workOrderNo: string;
};

export type PurchaseView =
  | { mode: "list" }
  | { mode: "show"; purchase: Purchase }
  | { mode: "upsert"; purchase: Purchase | null; returnTo: "list" | "show" };

export function createEmptyPurchase(): PurchaseSavePayload {
  return {
    billingAddress: "",
    customerEmail: "",
    customerName: "",
    customerPhone: "",
    invoiceNumber: "",
    issuedOn: new Date().toISOString().slice(0, 10),
    items: [],
    notes: "",
    roundOff: 0,
    shippingAddress: "",
    status: "draft",
    supplierBillDate: "",
    supplierBillNo: "",
    taxType: "cgst-sgst",
    terms: "",
    workOrderNo: "",
  };
}

export function createEmptyPurchaseItem(): PurchaseLineItemInput {
  return { colour: "", dcNo: "", description: "", hsnCode: "", poNo: "", productName: "", quantity: 1, rate: 0, size: "", taxRate: 18, unit: "Nos" };
}
