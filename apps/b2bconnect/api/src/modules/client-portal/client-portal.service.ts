import type { B2bConnectSession } from "../authentication/index.js";
import type { B2bConnectClientPortalDashboard } from "./client-portal.types.js";

export class B2bConnectClientPortalService {
  dashboard(session: B2bConnectSession): B2bConnectClientPortalDashboard {
    return {
      accessLabel: "Client portal",
      capabilities: ["Business profile", "Marketplace discovery", "Direct enquiries"],
      session,
      welcomeMessage: `Welcome back, ${session.name}. Your buyer and seller workspace is ready.`
    };
  }
}
