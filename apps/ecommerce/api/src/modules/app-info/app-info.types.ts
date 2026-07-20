export interface EcommerceAppInfo {
  appId: "ecommerce";
  brandName: string;
  businessModel: "multi-vendor-ecommerce";
  moduleBoundary: {
    current: ["app-info"];
    planned: ["vendors", "catalog", "cart", "orders", "fulfilment"];
  };
  purpose: string;
  stack: {
    foundation: ["framework", "platform", "core", "billing"];
    owner: "ecommerce";
  };
  status: "scaffold";
  tagline: string;
}

export interface EcommerceAppInfoConfig {
  brandName: string;
  purpose: string;
  tagline: string;
}
