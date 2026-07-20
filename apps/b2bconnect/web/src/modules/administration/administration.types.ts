import type { B2bConnectSession } from "../authentication";

export type B2bConnectAdministrationDashboard = {
  accessLabel: "Administration";
  capabilities: ["Member review", "Marketplace moderation", "Enquiry oversight"];
  session: B2bConnectSession;
  welcomeMessage: string;
};

export type B2bConnectAdministrationState =
  | { dashboard: null; error: ""; status: "loading" }
  | { dashboard: B2bConnectAdministrationDashboard; error: ""; status: "ready" }
  | { dashboard: null; error: string; status: "error" };
