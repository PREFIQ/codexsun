export interface B2bConnectAppInfo {
  appId: "b2bconnect";
  brandName: string;
  businessModel: "b2b-marketplace";
  purpose: string;
  stack: {
    foundation: ["framework", "platform", "core"];
    owner: "b2bconnect";
  };
  status: "foundation";
  tagline: string;
}

export type B2bConnectApiStatus = "checking" | "online" | "offline";
