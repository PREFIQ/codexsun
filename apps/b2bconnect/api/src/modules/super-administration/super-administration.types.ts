import type { B2bConnectSession } from "../authentication/index.js";

export type B2bConnectSuperAdministrationDashboard = {
  accessLabel: "Super administration";
  capabilities: ["Deployment control", "Access governance", "Platform health"];
  session: B2bConnectSession;
  welcomeMessage: string;
};
