export type PurchaseStatus = "draft" | "confirmed" | "cancelled";

export type PurchaseLineItemInput = {
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
  roundOff: number;
  shippingAddress: string;
  status: PurchaseStatus;
  supplierBillDate: string;
  supplierBillNo: string;
  taxType: string;
  workOrderNo: string;
};

export type PurchaseView =
  | { mode: "list" }
  | { mode: "show"; sale: Purchase }
  | { mode: "upsert"; sale: Purchase | null; returnTo: "list" | "show" };

export function createEmptyPurchase(): PurchaseSavePayload {
  return {
    billingAddress: "",
    currencyCode: "INR",
    customerEmail: "",
    customerName: "",
    customerPhone: "",
    invoiceNumber: "",
    issuedOn: new Date().toISOString().slice(0, 10),
    items: [createEmptyPurchaseItem()],
    notes: "",
    roundOff: 0,
    shippingAddress: "",
    status: "draft",
    supplierBillDate: "",
    supplierBillNo: "",
    taxType: "CGST + SGST",
    workOrderNo: "",
  };
}

export function createEmptyPurchaseItem(): PurchaseLineItemInput {
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
