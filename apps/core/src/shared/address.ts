export type AddressBlock = {
  addressId: string;
  tenantId: string;
  label: string;
  line1: string;
  line2?: string;
  country: string;
  state?: string;
  district?: string;
  city?: string;
  pincode?: string;
  gstStateCode?: string;
  isDefault: boolean;
  addressType: string;
  createdAt: string;
  updatedAt: string;
};

export const addressPermissions = ["core.common.view", "core.common.manage"] as const;
