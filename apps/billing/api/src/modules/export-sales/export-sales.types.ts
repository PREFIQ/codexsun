export type ExportSaleStatus = "draft" | "confirmed" | "cancelled";

export type ExportSaleLineItemInput = {
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

export type ExportSaleLineItem = ExportSaleLineItemInput & {
  id: string;
  lineTotal: number;
  taxableAmount: number;
  taxAmount: number;
};

export type ExportSale = {
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
  items: ExportSaleLineItem[];
  notes: string;
  roundOff: number;
  shippingAddress: string;
  status: ExportSaleStatus;
  subtotal: number;
  taxAmount: number;
  taxType: string;
  updatedAt: string;
  workOrderNo: string;
};

export type ExportSaleSavePayload = {
  billingAddress: string;
  currencyCode: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  invoiceNumber: string;
  issuedOn: string;
  items: ExportSaleLineItemInput[];
  notes: string;
  roundOff?: number;
  shippingAddress: string;
  status: ExportSaleStatus;
  taxType?: string;
  workOrderNo?: string;
};
