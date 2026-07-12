export type QuotationStatus = "draft" | "confirmed" | "cancelled";
export type QuotationTaxType = "cgst-sgst" | "igst";

export type QuotationLineItemInput = {
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

export type QuotationLineItem = QuotationLineItemInput & {
  cgstAmount: number;
  id: string;
  igstAmount: number;
  lineTotal: number;
  sgstAmount: number;
  taxableAmount: number;
  taxAmount: number;
};

export type Quotation = {
  amount: number;
  billingAddress: string;
  createdAt: string;
  customerName: string;
  date: string;
  generatedSalesInvoiceNo: string;
  id: string;
  items: QuotationLineItem[];
  notes: string;
  quotationNumber: string;
  roundOff: number;
  salesLedger: string;
  shippingAddress: string;
  status: QuotationStatus;
  subtotal: number;
  taxAmount: number;
  taxType: QuotationTaxType;
  terms: string;
  updatedAt: string;
  workOrderNo: string;
};

export type QuotationSavePayload = {
  billingAddress: string;
  customerName: string;
  date: string;
  items: QuotationLineItemInput[];
  notes: string;
  quotationNumber: string;
  roundOff?: number;
  salesLedger: string;
  shippingAddress: string;
  status: QuotationStatus;
  taxType: QuotationTaxType;
  terms: string;
  workOrderNo: string;
};

export type QuotationView =
  | { mode: "list" }
  | { mode: "show"; quotation: Quotation }
  | { mode: "upsert"; quotation: Quotation | null; returnTo: "list" | "show" };

export function createEmptyQuotation(): QuotationSavePayload {
  return {
    billingAddress: "",
    customerName: "",
    date: new Date().toISOString().slice(0, 10),
    items: [],
    notes: "",
    quotationNumber: "",
    roundOff: 0,
    salesLedger: "",
    shippingAddress: "",
    status: "draft",
    taxType: "cgst-sgst",
    terms: "",
    workOrderNo: ""
  };
}

export function createEmptyQuotationItem(): QuotationLineItemInput {
  return {
    colour: "",
    dcNo: "",
    description: "",
    hsnCode: "",
    poNo: "",
    productName: "",
    quantity: 1,
    rate: 0,
    size: "",
    taxRate: 18,
    unit: "Nos"
  };
}
