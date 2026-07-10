export type ExportSaleStatus = "draft" | "confirmed" | "cancelled";
export type ExportSaleTaxType = "cgst-sgst" | "igst";

export type ExportSaleLineItemInput = {
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

export type ExportSaleLineItem = ExportSaleLineItemInput & {
  cgstAmount: number;
  id: string;
  igstAmount: number;
  lineTotal: number;
  sgstAmount: number;
  taxableAmount: number;
  taxAmount: number;
};

export type ExportSale = {
  amount: number;
  billingAddress: string;
  createdAt: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  generatedSalesInvoiceNo?: string;
  id: string;
  currencyCode: string;
  invoiceNumber: string;
  items: ExportSaleLineItem[];
  issuedOn: string;
  notes: string;
  roundOff: number;
  salesLedger: string;
  shippingAddress: string;
  status: ExportSaleStatus;
  subtotal: number;
  taxAmount: number;
  taxType: ExportSaleTaxType;
  terms: string;
  updatedAt: string;
  workOrderNo: string;
};

export type ExportSaleSavePayload = {
  billingAddress: string;
  currencyCode?: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  issuedOn: string;
  invoiceNumber: string;
  items: ExportSaleLineItemInput[];
  notes: string;
  roundOff?: number;
  salesLedger: string;
  shippingAddress: string;
  status: ExportSaleStatus;
  taxType: ExportSaleTaxType;
  terms: string;
  workOrderNo: string;
};

export type ExportSaleView =
  | { mode: "list" }
  | { mode: "show"; exportSale: ExportSale }
  | { mode: "upsert"; exportSale: ExportSale | null; returnTo: "list" | "show" };

export type ExportSalesView = ExportSaleView;

export function createEmptyExportSale(): ExportSaleSavePayload {
  return {
    billingAddress: "",
    customerEmail: "",
    customerName: "",
    customerPhone: "",
    issuedOn: new Date().toISOString().slice(0, 10),
    items: [],
    notes: "",
    roundOff: 0,
    invoiceNumber: "",
    salesLedger: "",
    shippingAddress: "",
    status: "draft",
    taxType: "cgst-sgst",
    terms: "",
    workOrderNo: "",
  };
}

export function createEmptyExportSaleItem(): ExportSaleLineItemInput {
  return { colour: "", dcNo: "", description: "", hsnCode: "", poNo: "", productName: "", quantity: 1, rate: 0, size: "", taxRate: 18, unit: "Nos" };
}
