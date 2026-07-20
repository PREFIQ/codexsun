import type { B2bConnectSession } from "../authentication/index.js";

export type B2bConnectClientPortalDashboard = {
  accessLabel: "Client portal";
  capabilities: ["Business profile", "Marketplace discovery", "Direct enquiries"];
  session: B2bConnectSession;
  welcomeMessage: string;
};
