export interface EcommerceAppInfo {
  appId: "ecommerce";
  brandName: string;
  businessModel: "multi-vendor-ecommerce";
  purpose: string;
  stack: {
    foundation: ["framework", "platform", "core", "billing"];
    owner: "ecommerce";
  };
  status: "scaffold";
  tagline: string;
}

export type EcommerceApiStatus = "checking" | "online" | "offline";
