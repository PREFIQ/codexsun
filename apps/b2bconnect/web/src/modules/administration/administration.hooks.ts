import { useEffect, useState } from "react";
import { fetchB2bConnectAdministrationDashboard } from "./administration.services";
import type { B2bConnectAdministrationState } from "./administration.types";

export function useB2bConnectAdministrationDashboard() {
  const [state, setState] = useState<B2bConnectAdministrationState>({
    dashboard: null,
    error: "",
    status: "loading"
  });
  useEffect(() => {
    const controller = new AbortController();
    void fetchB2bConnectAdministrationDashboard(controller.signal)
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
