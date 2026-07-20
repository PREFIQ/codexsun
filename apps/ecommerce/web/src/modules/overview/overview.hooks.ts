import { useEffect, useState } from "react";
import { fetchEcommerceAppInfo } from "./overview.services";
import type { EcommerceApiStatus, EcommerceAppInfo } from "./overview.types";

export function useEcommerceAppInfo() {
  const [status, setStatus] = useState<EcommerceApiStatus>("checking");
  const [appInfo, setAppInfo] = useState<EcommerceAppInfo | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void fetchEcommerceAppInfo(controller.signal)
      .then((info) => {
        setAppInfo(info);
        setStatus("online");
      })
      .catch(() => setStatus("offline"));
    return () => controller.abort();
  }, []);

  return { appInfo, status } as const;
}
