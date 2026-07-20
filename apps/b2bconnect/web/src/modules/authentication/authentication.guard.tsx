import { GlobalLoader } from "@codexsun/ui";
import type { ReactElement } from "react";
import { useEffect } from "react";
import { useB2bConnectSession } from "./authentication.hooks";
import type { B2bConnectRole, B2bConnectSession } from "./authentication.types";

const loginPaths: Record<B2bConnectRole, string> = {
  admin: "/admin/login",
  client: "/login",
  super_admin: "/sa/login"
};

export function B2bConnectAuthenticationGate({
  children,
  role
}: {
  children: (session: B2bConnectSession) => ReactElement;
  role: B2bConnectRole;
}) {
  const state = useB2bConnectSession(role);

  useEffect(() => {
    if (state.status === "unauthenticated") {
      window.location.replace(loginPaths[role]);
    }
  }, [role, state.status]);

  if (state.status !== "authenticated") return <GlobalLoader />;
  return children(state.session);
}
