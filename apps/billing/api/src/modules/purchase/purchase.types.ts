export type PurchaseStatus = "draft" | "confirmed" | "cancelled";

export type PurchaseLineItemInput = {
  colour?: string;
  dcNo?: string;
  description: string;
  hsnCode: string;
  poNo?: string;
  productName: string;
  quantity: number;
  rate: number;
  size?: string;
  taxRate: number;
  unit: string;
};

export type PurchaseLineItem = PurchaseLineItemInput & {
  id: string;
  lineTotal: number;
  taxableAmount: number;
  taxAmount: number;
};

export type Purchase = {
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
  items: PurchaseLineItem[];
  notes: string;
  roundOff: number;
  shippingAddress: string;
  status: PurchaseStatus;
  subtotal: number;
  supplierBillDate: string;
  supplierBillNo: string;
  taxAmount: number;
  taxType: string;
  updatedAt: string;
  workOrderNo: string;
};

export type PurchaseSavePayload = {
  billingAddress: string;
  currencyCode: string;
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
  taxType?: string;
  workOrderNo?: string;
};
