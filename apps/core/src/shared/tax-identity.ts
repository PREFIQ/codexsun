export type TaxIdentityBlock = {
  taxId: string;
  type: "gstin" | "pan" | "tan" | "cin" | "other";
  value: string;
  isDefault: boolean;
};
