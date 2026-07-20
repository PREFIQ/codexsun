import { useEffect, useState } from "react";
import { fetchB2bConnectClientPortalDashboard } from "./client-portal.services";
import type { B2bConnectClientPortalState } from "./client-portal.types";

export function useB2bConnectClientPortalDashboard() {
  const [state, setState] = useState<B2bConnectClientPortalState>({
    dashboard: null,
    error: "",
    status: "loading"
  });
  useEffect(() => {
    const controller = new AbortController();
    void fetchB2bConnectClientPortalDashboard(controller.signal)
      .then((dashboard) => setState({ dashboard, error: "", status: "ready" }))
      .catch((error) =>
        setState({
          dashboard: null,
          error: error instanceof Error ? error.message : "Unable to load dashboard.",
          status: "error"
        })
      );
    return () => controller.abort();
  }, []);
  return state;
}
