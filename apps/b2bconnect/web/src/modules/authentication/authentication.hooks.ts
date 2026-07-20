import { useEffect, useState } from "react";
import { fetchB2bConnectSession } from "./authentication.services";
import type { B2bConnectRole, B2bConnectSessionState } from "./authentication.types";

export function useB2bConnectSession(role: B2bConnectRole) {
  const [state, setState] = useState<B2bConnectSessionState>({
    session: null,
    status: "checking"
  });

  useEffect(() => {
    const controller = new AbortController();
    void fetchB2bConnectSession(role, controller.signal)
      .then((session) =>
        setState(
          session
            ? { session, status: "authenticated" }
            : { session: null, status: "unauthenticated" }
        )
      )
      .catch(() => setState({ session: null, status: "unauthenticated" }));
    return () => controller.abort();
  }, [role]);

  return state;
}
