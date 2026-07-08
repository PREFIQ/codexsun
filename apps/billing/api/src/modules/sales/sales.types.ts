export type SaleStatus = "draft" | "confirmed" | "cancelled";

export type Sale = {
  amount: number;
  customerName: string;
  currencyCode: string;
  id: string;
  invoiceNumber: string;
  issuedOn: string;
  status: SaleStatus;
};

export type SaleSavePayload = Omit<Sale, "id">;
