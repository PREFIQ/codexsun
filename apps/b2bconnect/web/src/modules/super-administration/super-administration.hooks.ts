import { useEffect, useState } from "react";
import { fetchB2bConnectSuperAdministrationDashboard } from "./super-administration.services";
import type { B2bConnectSuperAdministrationState } from "./super-administration.types";

export function useB2bConnectSuperAdministrationDashboard() {
  const [state, setState] = useState<B2bConnectSuperAdministrationState>({
    dashboard: null,
    error: "",
    status: "loading"
  });
  useEffect(() => {
    const controller = new AbortController();
    void fetchB2bConnectSuperAdministrationDashboard(controller.signal)
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
