export type ExportSaleStatus = "draft" | "confirmed" | "cancelled";

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
  roundOff: number;
  shippingAddress: string;
  status: ExportSaleStatus;
  taxType: string;
  workOrderNo: string;
};

export type ExportSalesView =
  | { mode: "list" }
  | { mode: "show"; sale: ExportSale }
  | { mode: "upsert"; sale: ExportSale | null; returnTo: "list" | "show" };

export function createEmptyExportSale(): ExportSaleSavePayload {
  return {
    billingAddress: "",
    currencyCode: "INR",
    customerEmail: "",
    customerName: "",
    customerPhone: "",
    invoiceNumber: "",
    issuedOn: new Date().toISOString().slice(0, 10),
    items: [createEmptyExportSaleItem()],
    notes: "",
    roundOff: 0,
    shippingAddress: "",
    status: "draft",
    taxType: "IGST",
    workOrderNo: "",
  };
}

export function createEmptyExportSaleItem(): ExportSaleLineItemInput {
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
    unit: "NOS",
  };
}
