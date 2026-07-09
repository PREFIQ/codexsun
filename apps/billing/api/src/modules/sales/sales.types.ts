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
  id: string;
  lineTotal: number;
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
  status: SaleStatus;
  subtotal: number;
  taxAmount: number;
  updatedAt: string;
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
  status: SaleStatus;
};
