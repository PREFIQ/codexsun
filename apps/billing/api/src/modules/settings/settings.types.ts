export type BillingGstApiMode = "einvoice_eway" | "eway_only";

export type BillingDocumentKind = "quotation" | "sales" | "purchase";

export type BillingDocumentLayoutSettings = {
  useColour: boolean;
  useDc: boolean;
  useEinvoice: boolean;
  useEway: boolean;
  usePo: boolean;
  useSize: boolean;
};

export type BillingSettings = {
  features: {
    quotation: boolean;
    purchase: boolean;
    sales: boolean;
  };
  gstApiMode: BillingGstApiMode;
  layout: Record<BillingDocumentKind, BillingDocumentLayoutSettings>;
};

export type BillingSalesSettings = BillingSettings;

export const defaultBillingDocumentLayoutSettings: BillingDocumentLayoutSettings = {
  useColour: true,
  useDc: false,
  useEinvoice: true,
  useEway: true,
  usePo: false,
  useSize: true,
};

export const defaultBillingSettings: BillingSettings = {
  features: {
    purchase: true,
    quotation: true,
    sales: true,
  },
  gstApiMode: "einvoice_eway",
  layout: {
    purchase: { ...defaultBillingDocumentLayoutSettings },
    quotation: { ...defaultBillingDocumentLayoutSettings },
    sales: { ...defaultBillingDocumentLayoutSettings },
  },
};

export const defaultBillingSalesSettings = defaultBillingSettings;
