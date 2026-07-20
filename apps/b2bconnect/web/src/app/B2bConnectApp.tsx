import type { B2bConnectSession } from "../modules/authentication";
import { B2bConnectClientPortalWorkspace } from "../modules/client-portal";

export function B2bConnectApp({ session }: { session: B2bConnectSession }) {
  return <B2bConnectClientPortalWorkspace session={session} />;
}
