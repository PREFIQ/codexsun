export interface B2bConnectAppInfo {
  appId: "b2bconnect";
  brandName: string;
  businessModel: "b2b-marketplace";
  moduleBoundary: {
    current: [
      "app-info",
      "authentication",
      "business-profile",
      "client-portal",
      "network-blueprint",
      "administration",
      "super-administration"
    ];
    planned: [
      "leads",
      "rfq",
      "capacity-exchange",
      "networking",
      "jobs",
      "events",
      "finance",
      "export-intelligence"
    ];
  };
  purpose: string;
  stack: {
    foundation: ["framework", "platform", "core"];
    owner: "b2bconnect";
  };
  status: "foundation";
  tagline: string;
}

export interface B2bConnectAppInfoConfig {
  brandName: string;
  purpose: string;
  tagline: string;
}
