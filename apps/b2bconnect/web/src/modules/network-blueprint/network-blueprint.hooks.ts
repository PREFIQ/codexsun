import { useEffect, useState } from "react";
import { fetchNetworkBlueprint } from "./network-blueprint.services";
import type { NetworkBlueprint } from "./network-blueprint.types";

export function useNetworkBlueprint() {
  const [blueprint, setBlueprint] = useState<NetworkBlueprint | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  useEffect(() => {
    const controller = new AbortController();
    void fetchNetworkBlueprint(controller.signal)
      .then((data) => {
        setBlueprint(data);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
    return () => controller.abort();
  }, []);
  return { blueprint, status } as const;
}
