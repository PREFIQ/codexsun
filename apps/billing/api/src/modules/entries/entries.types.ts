export type EntryKind = "quotation" | "sales" | "purchase" | "exportSales";

export type EntryStatus = "draft" | "posted" | "cancelled";
export type EntryPaymentStatus = "unpaid" | "partial" | "paid";
export type SupplyMode = "cgst-sgst" | "igst";

export type EntryContactRecord = {
  addressLine1: string | null;
  addressLine2: string | null;
  cityId: string | null;
  cityName: string | null;
  code: string;
  countryId: string | null;
  countryName: string | null;
  districtId: string | null;
  districtName: string | null;
  email: string | null;
  gstin: string | null;
  id: string;
  isActive: boolean;
  legalName: string | null;
  name: string;
  phone: string | null;
  pincodeId: string | null;
  pincodeName: string | null;
  stateId: string | null;
  stateName: string | null;
  tenantId: string;
  uuid: string;
};

export type EntryProductRecord = {
  code: string;
  hsnCode: string | null;
  hsnCodeId: string | null;
  id: string;
  isActive: boolean;
  name: string;
  price: number;
  productTypeId: string | null;
  productTypeName: string | null;
  taxDescription: string | null;
  taxId: string | null;
  taxRate: number;
  tenantId: string;
  unitId: string | null;
  unitName: string | null;
  uuid: string;
};

export type EntryLineInput = {
  colourId?: string | null;
  colourName?: string | null;
  dcNo?: string | null;
  description?: string | null;
  discountAmount?: number;
  hsnCode?: string | null;
  hsnCodeId?: string | null;
  productId?: string | null;
  productName?: string | null;
  poNo?: string | null;
  quantity?: number;
  rate?: number;
  sizeId?: string | null;
  sizeName?: string | null;
  taxDescription?: string | null;
  taxId?: string | null;
  taxRate?: number;
  unitId?: string | null;
  unitName?: string | null;
};

export type EntryLineRecord = {
  colourId: string | null;
  colourName: string | null;
  dcNo: string | null;
  description: string | null;
  discountAmount: number;
  hsnCode: string | null;
  hsnCodeId: string | null;
  id: string;
  lineTotal: number;
  productId: string | null;
  productName: string;
  poNo: string | null;
  quantity: number;
  rate: number;
  sizeId: string | null;
  sizeName: string | null;
  sortOrder: number;
  taxAmount: number;
  taxDescription: string | null;
  taxId: string | null;
  taxRate: number;
  unitId: string | null;
  unitName: string | null;
  uuid: string;
};

export type EntryCommentRecord = {
  authorEmail: string;
  body: string;
  createdAt: string;
  id: string;
  uuid: string;
};

export type EntryActivityRecord = {
  actorEmail: string;
  activityType: string;
  createdAt: string;
  id: string;
  message: string;
  payload: Record<string, unknown> | null;
  uuid: string;
};

export type EntrySource = {
  generatedSalesAt?: string | null;
  generatedSalesDocumentNo?: string | null;
  generatedSalesEntryId?: string | null;
  sourceQuotationNos?: string[];
  sourceQuotationUuids?: string[];
  [key: string]: unknown;
};

export type EntryRecord = {
  ackDate: string | null;
  ackNo: string | null;
  balanceAmount: number;
  billingAddress: string | null;
  createdAt: string;
  customerId: string | null;
  customerName: string;
  customerGstin: string | null;
  customerStateCode: string | null;
  customerStateName: string | null;
  discountTotal: number;
  documentDate: string;
  documentNo: string;
  dueDate: string | null;
  ewayBillDate: string | null;
  ewayBillNo: string | null;
  ewayPart: string | null;
  generatedSalesAt: string | null;
  generatedSalesDocumentNo: string | null;
  generatedSalesEntryId: string | null;
  grandTotal: number;
  id: string;
  irn: string | null;
  isActive: boolean;
  kind: EntryKind;
  lines: EntryLineRecord[];
  notes: string | null;
  paidAmount: number;
  paymentStatus: EntryPaymentStatus;
  paymentTermId: string | null;
  paymentTermName: string | null;
  placeOfSupply: SupplyMode;
  referenceNo: string | null;
  roundOff: number;
  salesTypeId: string | null;
  salesTypeName: string | null;
  shippingAddress: string | null;
  signedQr: string | null;
  source: EntrySource | null;
  status: EntryStatus;
  subtotal: number;
  supplierBillDate: string | null;
  supplierBillNo: string | null;
  taxTotal: number;
  taxableTotal: number;
  tenantId: string;
  terms: string | null;
  transportAddress: string | null;
  transportContactNo: string | null;
  transportContactPerson: string | null;
  transportGst: string | null;
  transportId: string | null;
  transportName: string | null;
  updatedAt: string;
  uuid: string;
  vehicleNo: string | null;
  workOrderNo: string | null;
  comments: EntryCommentRecord[];
  activities: EntryActivityRecord[];
};

export type EntryFilters = {
  active?: string;
  search?: string;
  status?: string;
};

export type EntryUpsertInput = {
  ackDate?: string | null;
  ackNo?: string | null;
  billingAddress?: string | null;
  customerId?: string | null;
  customerName?: string | null;
  customerGstin?: string | null;
  customerStateCode?: string | null;
  customerStateName?: string | null;
  discountTotal?: number;
  documentDate?: string | null;
  documentNo?: string | null;
  dueDate?: string | null;
  ewayBillDate?: string | null;
  ewayBillNo?: string | null;
  ewayPart?: string | null;
  id?: string | null;
  irn?: string | null;
  isActive?: boolean;
  lines?: EntryLineInput[];
  notes?: string | null;
  paidAmount?: number;
  paymentStatus?: EntryPaymentStatus | string | null;
  paymentTermId?: string | null;
  paymentTermName?: string | null;
  placeOfSupply?: SupplyMode | string | null;
  referenceNo?: string | null;
  roundOff?: number;
  salesTypeId?: string | null;
  salesTypeName?: string | null;
  shippingAddress?: string | null;
  signedQr?: string | null;
  source?: EntrySource | null;
  status?: EntryStatus | string | null;
  supplierBillDate?: string | null;
  supplierBillNo?: string | null;
  terms?: string | null;
  transportAddress?: string | null;
  transportContactNo?: string | null;
  transportContactPerson?: string | null;
  transportGst?: string | null;
  transportId?: string | null;
  transportName?: string | null;
  vehicleNo?: string | null;
  workOrderNo?: string | null;
};

export type CommentCreateInput = {
  authorEmail?: string | null;
  body?: string | null;
};

export type ConvertQuotationsInput = {
  quotationIds?: string[];
};
