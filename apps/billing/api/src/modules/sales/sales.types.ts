export type SaleStatus = "draft" | "confirmed" | "cancelled";

export type SaleLineItemInput = {
  colour?: string;
  dcNo?: string;
  description: string;
  hsnCode: string;
  poNo?: string;
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
