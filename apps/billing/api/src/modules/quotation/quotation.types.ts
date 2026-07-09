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
