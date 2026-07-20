import { useEffect, useState } from "react";
import { fetchB2bConnectAppInfo } from "./overview.services";
import type { B2bConnectApiStatus, B2bConnectAppInfo } from "./overview.types";

export function useB2bConnectAppInfo() {
  const [status, setStatus] = useState<B2bConnectApiStatus>("checking");
  const [appInfo, setAppInfo] = useState<B2bConnectAppInfo | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void fetchB2bConnectAppInfo(controller.signal)
      .then((info) => {
        setAppInfo(info);
        setStatus("online");
      })
      .catch(() => setStatus("offline"));
    return () => controller.abort();
  }, []);

  return { appInfo, status } as const;
}
