export type SaleStatus = "draft" | "confirmed" | "cancelled";
export type GstDocumentStatus = "not-generated" | "generated";

export type SaleEwayDetails = {
  billDate: string;
  billNo: string;
  notes: string;
  part: "Part A" | "Part B";
  status: GstDocumentStatus;
  transport: string;
  transportGst: string;
  vehicleNo: string;
};

export type SaleEinvoiceDetails = {
  ackDate: string;
  ackNo: string;
  irn: string;
  signedQr: string;
  status: GstDocumentStatus;
};

export type SaleLineItemInput = {
  colour?: string;
  dcNo?: string;
  description: string;
  hsnCode: string;
  poNo?: string;
  productName?: string;
  quantity: number;
  rate: number;
  size?: string;
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
  currencyCode: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  einvoice: SaleEinvoiceDetails;
  eway: SaleEwayDetails;
  id: string;
  invoiceNumber: string;
  issuedOn: string;
  items: SaleLineItem[];
  notes: string;
  roundOff: number;
  shippingAddress: string;
  salesLedger: string;
  status: SaleStatus;
  subtotal: number;
  taxAmount: number;
  taxType: "cgst-sgst" | "igst";
  terms: string;
  updatedAt: string;
  workOrderNo: string;
};

export type SaleSavePayload = {
  billingAddress: string;
  currencyCode: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  einvoice?: SaleEinvoiceDetails;
  eway?: SaleEwayDetails;
  invoiceNumber: string;
  issuedOn: string;
  items: SaleLineItemInput[];
  notes: string;
  roundOff?: number;
  shippingAddress: string;
  salesLedger?: string;
  status: SaleStatus;
  taxType?: "cgst-sgst" | "igst";
  terms?: string;
  workOrderNo?: string;
};
