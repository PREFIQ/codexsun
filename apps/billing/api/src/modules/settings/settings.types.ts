export type BillingGstApiMode = "einvoice_eway" | "eway_only";

export type BillingSalesSettings = {
  featureQuotation: boolean;
  gstApiMode: BillingGstApiMode;
  useColour: boolean;
  useDc: boolean;
  useEinvoice: boolean;
  useEway: boolean;
  usePo: boolean;
  useSize: boolean;
};

export const defaultBillingSalesSettings: BillingSalesSettings = {
  featureQuotation: true,
  gstApiMode: "einvoice_eway",
  useColour: true,
  useDc: false,
  useEinvoice: true,
  useEway: true,
  usePo: false,
  useSize: true,
};
