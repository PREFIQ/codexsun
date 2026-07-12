export type PaymentTermsRecord = {
  id: string;
  uuid: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
};

export type PaymentTermsSavePayload = {
  name: string;
  isActive?: boolean;
  sortOrder?: number;
};

export type PaymentTermsListFilters = { search?: string };
