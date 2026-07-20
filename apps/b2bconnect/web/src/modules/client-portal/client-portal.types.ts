import type { B2bConnectSession } from "../authentication";

export type B2bConnectClientPortalDashboard = {
  accessLabel: "Client portal";
  capabilities: ["Business profile", "Marketplace discovery", "Direct enquiries"];
  session: B2bConnectSession;
  welcomeMessage: string;
};

export type B2bConnectClientPortalState =
  | { dashboard: null; error: ""; status: "loading" }
  | { dashboard: B2bConnectClientPortalDashboard; error: ""; status: "ready" }
  | { dashboard: null; error: string; status: "error" };
