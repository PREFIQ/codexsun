import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { Toaster } from "@codexsun/ui";
import { useEffect } from "react";
import { router } from "./router";

const queryClient = new QueryClient();

export function BillingWebApp() {
  useEffect(() => {
    const refreshScope = () => {
      void queryClient.invalidateQueries({ queryKey: ["billing"] });
    };
    window.addEventListener("codexsun:company-change", refreshScope);
    window.addEventListener("codexsun:accounting-year-change", refreshScope);
    return () => {
      window.removeEventListener("codexsun:company-change", refreshScope);
      window.removeEventListener("codexsun:accounting-year-change", refreshScope);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
    </QueryClientProvider>
  );
}
