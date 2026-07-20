import type { B2bConnectSession } from "../authentication";

export type B2bConnectSuperAdministrationDashboard = {
  accessLabel: "Super administration";
  capabilities: ["Deployment control", "Access governance", "Platform health"];
  session: B2bConnectSession;
  welcomeMessage: string;
};

export type B2bConnectSuperAdministrationState =
  | { dashboard: null; error: ""; status: "loading" }
  | { dashboard: B2bConnectSuperAdministrationDashboard; error: ""; status: "ready" }
  | { dashboard: null; error: string; status: "error" };
