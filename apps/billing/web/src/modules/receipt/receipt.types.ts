export type ReceiptStatus = "draft" | "posted" | "cancelled";
export type ReceiptMode = "cash" | "bank" | "upi" | "transfer";
export type ReceiptContext = {
  companyId: number;
  companyName: string;
  currencyCode: string;
  currencyId: number;
  financialYearId: number;
  financialYearName: string;
  suggestedReceiptNumber: string;
};
export type ReceiptAllocationInput = { allocatedAmount: number; saleId: string };
export type ReceiptAllocation = ReceiptAllocationInput & {
  documentDate: string;
  documentNo: string;
  documentTotal: number;
  id: string;
  previousBalance: number;
};
export type Receipt = {
  allocatedAmount: number;
  allocations: ReceiptAllocation[];
  amount: number;
  companyId: number;
  companyName: string;
  createdAt: string;
  currencyCode: string;
  currencyId: number;
  customerId: number;
  customerName: string;
  discountAmount: number;
  financialYearId: number;
  financialYearName: string;
  id: string;
  ledgerId: number;
  ledgerName: string;
  lineNumber: number;
  notes: string;
  receiptDate: string;
  receiptMode: ReceiptMode;
  receiptNumber: string;
  referenceDate: string;
  referenceNo: string;
  roundOff: number;
  status: ReceiptStatus;
  tdsAmount: number;
  totalAmount: number;
  unallocatedAmount: number;
  updatedAt: string;
};
export type ReceiptSavePayload = {
  allocations: ReceiptAllocationInput[];
  amount: number;
  companyId: number;
  currencyId: number;
  customerId: number;
  discountAmount: number;
  financialYearId: number;
  ledgerId: number;
  notes: string;
  receiptDate: string;
  receiptMode: ReceiptMode;
  receiptNumber: string;
  referenceDate: string;
  referenceNo: string;
  roundOff: number;
  tdsAmount: number;
};
export type ReceiptAllocationCandidate = {
  customerId: number;
  documentDate: string;
  documentNo: string;
  documentTotal: number;
  outstandingAmount: number;
  saleId: string;
};
export type ReceiptLookupRecord = {
  code?: string | null;
  id: string;
  isActive?: boolean | null;
  name?: string | null;
  primaryEmail?: string | null;
  primaryPhone?: string | null;
};
export type ReceiptLookupOption = {
  description?: string;
  label: string;
  record: ReceiptLookupRecord;
  value: string;
};
export type ReceiptView =
  | { mode: "list" }
  | { mode: "upsert"; receipt: Receipt | null; returnTo: "list" | "show" }
  | { mode: "show"; receipt: Receipt };

export function emptyReceipt(context?: ReceiptContext | null): ReceiptSavePayload {
  return {
    allocations: [],
    amount: 0,
    companyId: context?.companyId ?? 0,
    currencyId: context?.currencyId ?? 0,
    customerId: 0,
    discountAmount: 0,
    financialYearId: context?.financialYearId ?? 0,
    ledgerId: 0,
    notes: "",
    receiptDate: new Date().toISOString().slice(0, 10),
    receiptMode: "cash",
    receiptNumber: context?.suggestedReceiptNumber ?? "",
    referenceDate: "",
    referenceNo: "",
    roundOff: 0,
    tdsAmount: 0
  };
}

export function receiptToPayload(receipt: Receipt): ReceiptSavePayload {
  return {
    allocations: receipt.allocations.map(({ allocatedAmount, saleId }) => ({
      allocatedAmount,
      saleId
    })),
    amount: receipt.amount,
    companyId: receipt.companyId,
    currencyId: receipt.currencyId,
    customerId: receipt.customerId,
    discountAmount: receipt.discountAmount,
    financialYearId: receipt.financialYearId,
    ledgerId: receipt.ledgerId,
    notes: receipt.notes,
    receiptDate: receipt.receiptDate,
    receiptMode: receipt.receiptMode,
    receiptNumber: receipt.receiptNumber,
    referenceDate: receipt.referenceDate,
    referenceNo: receipt.referenceNo,
    roundOff: receipt.roundOff,
    tdsAmount: receipt.tdsAmount
  };
}
