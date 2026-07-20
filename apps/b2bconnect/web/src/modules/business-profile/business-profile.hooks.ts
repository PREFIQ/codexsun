import { useCallback, useEffect, useState } from "react";
import {
  fetchAdministrationBusinessProfiles,
  fetchOwnBusinessProfile,
  fetchPublicBusinessProfiles,
  fetchSuperAdministrationBusinessProfiles
} from "./business-profile.services";
import type { BusinessProfile, PublicBusinessProfile } from "./business-profile.types";

function useProfileCollection<T>(loader: (signal: AbortSignal) => Promise<T[]>) {
  const [items, setItems] = useState<T[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((value) => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    void loader(controller.signal)
      .then((data) => {
        setItems(data);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
    return () => controller.abort();
  }, [loader, revision]);
  return { items, refresh, status } as const;
}
export function useOwnBusinessProfile() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  useEffect(() => {
    const controller = new AbortController();
    void fetchOwnBusinessProfile(controller.signal)
      .then((data) => {
        setProfile(data);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
    return () => controller.abort();
  }, []);
  return { profile, setProfile, status } as const;
}
export function useAdministrationBusinessProfiles() {
  return useProfileCollection<BusinessProfile>(fetchAdministrationBusinessProfiles);
}
export function useSuperAdministrationBusinessProfiles() {
  return useProfileCollection<BusinessProfile>(fetchSuperAdministrationBusinessProfiles);
}
export function usePublicBusinessProfiles() {
  return useProfileCollection<PublicBusinessProfile>(fetchPublicBusinessProfiles);
}
