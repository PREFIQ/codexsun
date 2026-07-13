import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider, useIsFetching } from "@tanstack/react-query";
import { GlobalLoader } from "@codexsun/ui/components/global-loader";

const queryClient = new QueryClient();

export function AppProviders({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

export function GlobalQueryLoader() {
  const fetchingCount = useIsFetching({
    predicate: (query) =>
      query.state.data === undefined && query.meta?.suppressGlobalLoader !== true
  });
  return fetchingCount > 0 ? <GlobalLoader /> : null;
}
