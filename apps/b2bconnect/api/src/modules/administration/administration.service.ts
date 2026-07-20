import type { B2bConnectSession } from "../authentication/index.js";
import type { B2bConnectAdministrationDashboard } from "./administration.types.js";

export class B2bConnectAdministrationService {
  dashboard(session: B2bConnectSession): B2bConnectAdministrationDashboard {
    return {
      accessLabel: "Administration",
      capabilities: ["Member review", "Marketplace moderation", "Enquiry oversight"],
      session,
      welcomeMessage: `Welcome, ${session.name}. B2B marketplace operations are connected.`
    };
  }
}
