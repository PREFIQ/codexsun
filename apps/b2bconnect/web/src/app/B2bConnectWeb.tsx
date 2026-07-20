import { B2bConnectLandingPage } from "../public";
import { B2bConnectAdministrationWorkspace } from "../modules/administration";
import {
  B2bConnectAuthenticationGate,
  B2bConnectAuthenticationWorkspace
} from "../modules/authentication";
import { B2bConnectSuperAdministrationWorkspace } from "../modules/super-administration";
import { B2bConnectApp } from "./B2bConnectApp";

export function B2bConnectWeb() {
  const path = window.location.pathname.replace(/\/+$/u, "") || "/";

  if (path === "/login") {
    return <B2bConnectAuthenticationWorkspace role="client" />;
  }
  if (path === "/admin/login") {
    return <B2bConnectAuthenticationWorkspace role="admin" />;
  }
  if (path === "/sa/login") {
    return <B2bConnectAuthenticationWorkspace role="super_admin" />;
  }
  if (path === "/app" || path === "/dashboard" || path.startsWith("/app/")) {
    return (
      <B2bConnectAuthenticationGate role="client">
        {(session) => <B2bConnectApp session={session} />}
      </B2bConnectAuthenticationGate>
    );
  }
  if (path === "/admin" || path.startsWith("/admin/")) {
    return (
      <B2bConnectAuthenticationGate role="admin">
        {(session) => <B2bConnectAdministrationWorkspace session={session} />}
      </B2bConnectAuthenticationGate>
    );
  }
  if (path === "/sa" || path.startsWith("/sa/")) {
    return (
      <B2bConnectAuthenticationGate role="super_admin">
        {(session) => <B2bConnectSuperAdministrationWorkspace session={session} />}
      </B2bConnectAuthenticationGate>
    );
  }

  return <B2bConnectLandingPage />;
}
