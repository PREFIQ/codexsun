export type SaleStatus = "draft" | "confirmed" | "cancelled";

export type SaleLineItemInput = {
  description: string;
  hsnCode: string;
  quantity: number;
  rate: number;
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
  roundOff: number;
  shippingAddress: string;
  status: SaleStatus;
};

export type SalesView =
  | { mode: "list" }
  | { mode: "show"; sale: Sale }
  | { mode: "upsert"; sale: Sale | null; returnTo: "list" | "show" };

export function createEmptySale(): SaleSavePayload {
  return {
    billingAddress: "",
    currencyCode: "INR",
    customerEmail: "",
    customerName: "",
    customerPhone: "",
    invoiceNumber: "",
    issuedOn: new Date().toISOString().slice(0, 10),
    items: [createEmptySaleItem()],
    notes: "",
    roundOff: 0,
    shippingAddress: "",
    status: "draft",
  };
}

export function createEmptySaleItem(): SaleLineItemInput {
  return {
    description: "",
    hsnCode: "",
    quantity: 1,
    rate: 0,
    taxRate: 18,
    unit: "NOS",
  };
}
