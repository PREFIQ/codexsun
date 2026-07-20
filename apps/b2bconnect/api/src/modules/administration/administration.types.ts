import type { B2bConnectSession } from "../authentication/index.js";

export type B2bConnectAdministrationDashboard = {
  accessLabel: "Administration";
  capabilities: ["Member review", "Marketplace moderation", "Enquiry oversight"];
  session: B2bConnectSession;
  welcomeMessage: string;
};
