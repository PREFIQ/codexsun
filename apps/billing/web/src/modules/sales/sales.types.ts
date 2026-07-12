export type SaleStatus = "draft" | "confirmed" | "cancelled";
export type SaleTaxType = "cgst-sgst" | "igst";
export type SaleGstDocumentStatus = "not-generated" | "generated";

export type SaleEwayDetails = {
  billDate: string;
  billNo: string;
  notes: string;
  part: "Part A" | "Part B";
  status: SaleGstDocumentStatus;
  transport: string;
  transportGst: string;
  vehicleNo: string;
};

export type SaleEinvoiceDetails = {
  ackDate: string;
  ackNo: string;
  irn: string;
  signedQr: string;
  status: SaleGstDocumentStatus;
};

export type SaleLineItemInput = {
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

export type SaleLineItem = SaleLineItemInput & {
  cgstAmount: number;
  id: string;
  igstAmount: number;
  lineTotal: number;
  sgstAmount: number;
  taxableAmount: number;
  taxAmount: number;
};

export type Sale = {
  amount: number;
  billingAddress: string;
  createdAt: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  einvoice: SaleEinvoiceDetails;
  eway: SaleEwayDetails;
  generatedSalesInvoiceNo?: string;
  id: string;
  currencyCode: string;
  invoiceNumber: string;
  items: SaleLineItem[];
  issuedOn: string;
  notes: string;
  roundOff: number;
  saleNumber: string;
  salesLedger: string;
  shippingAddress: string;
  status: SaleStatus;
  subtotal: number;
  taxAmount: number;
  taxType: SaleTaxType;
  terms: string;
  updatedAt: string;
  workOrderNo: string;
};

export type SaleSavePayload = {
  billingAddress: string;
  currencyCode?: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  einvoice?: SaleEinvoiceDetails;
  eway?: SaleEwayDetails;
  issuedOn: string;
  invoiceNumber?: string;
  items: SaleLineItemInput[];
  notes: string;
  roundOff?: number;
  saleNumber: string;
  salesLedger: string;
  shippingAddress: string;
  status: SaleStatus;
  taxType: SaleTaxType;
  terms: string;
  workOrderNo: string;
};

export type SaleView =
  | { mode: "list" }
  | { mode: "show"; sale: Sale }
  | { mode: "upsert"; sale: Sale | null; returnTo: "list" | "show" };

export type SalesView = SaleView;

export function createEmptySale(): SaleSavePayload {
  return {
    billingAddress: "",
    customerEmail: "",
    customerName: "",
    customerPhone: "",
    einvoice: createEmptySaleEinvoice(),
    eway: createEmptySaleEway(),
    issuedOn: new Date().toISOString().slice(0, 10),
    items: [],
    notes: "",
    roundOff: 0,
    saleNumber: "",
    salesLedger: "",
    shippingAddress: "",
    status: "draft",
    taxType: "cgst-sgst",
    terms: "",
    workOrderNo: ""
  };
}

export function createEmptySaleEway(): SaleEwayDetails {
  return {
    billDate: "",
    billNo: "",
    notes: "",
    part: "Part B",
    status: "not-generated",
    transport: "",
    transportGst: "",
    vehicleNo: ""
  };
}

export function createEmptySaleEinvoice(): SaleEinvoiceDetails {
  return { ackDate: "", ackNo: "", irn: "", signedQr: "", status: "not-generated" };
}

export function createEmptySaleItem(): SaleLineItemInput {
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
