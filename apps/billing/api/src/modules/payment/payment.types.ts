export type PaymentStatus = "draft" | "posted" | "cancelled";

export type PaymentAllocation = {
  documentNo: string;
  documentDate: string;
  documentTotal: number;
  previousBalance: number;
  allocatedAmount: number;
};

export type Payment = {
  id: string;
  paymentNumber: string;
  paymentDate: string;
  partyName: string;
  partyId: string;
  partyType: string;
  paymentMode: string;
  bankAccount: string;
  referenceNo: string;
  referenceDate: string;
  amount: number;
  tdsAmount: number;
  discountAmount: number;
  roundOff: number;
  totalAmount: number;
  allocatedAmount: number;
  unallocatedAmount: number;
  status: PaymentStatus;
  notes: string;
  allocations: PaymentAllocation[];
  createdAt: string;
  updatedAt: string;
};

export type PaymentInput = Omit<
  Partial<Payment>,
  "id" | "createdAt" | "updatedAt" | "totalAmount" | "allocatedAmount" | "unallocatedAmount"
> & {
  paymentNumber?: string;
  paymentDate: string;
  partyName: string;
  amount: number;
  allocations?: PaymentAllocation[];
};
