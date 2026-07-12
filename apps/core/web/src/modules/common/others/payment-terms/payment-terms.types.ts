export type PaymentTermsValue = boolean | number | string | null;
export type PaymentTermsRecord = {
  id: number;
  isActive: boolean;
  [key: string]: PaymentTermsValue;
};
export type PaymentTermsField = {
  key: string;
  label: string;
  required?: boolean;
  type: "boolean" | "color" | "date" | "number" | "string";
};
export type PaymentTermsDefinition = {
  fields: PaymentTermsField[];
  group: "contacts" | "others" | "products" | "workorder";
  key: string;
  label: string;
  path: string;
  route: string;
};

export const paymentTermsDefinition: PaymentTermsDefinition = {
  fields: [
    {
      key: "name",
      label: "Name",
      type: "string",
      required: true
    }
  ],
  group: "others",
  key: "paymentTerms",
  label: "Payment Terms",
  path: "/core/common/others/payment-terms",
  route: "core.common.others.payment_terms"
};
