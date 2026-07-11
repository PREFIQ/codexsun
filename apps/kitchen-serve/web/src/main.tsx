import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { KitchenServeApp } from "./app/KitchenServeApp";
import "./styles.css";
createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={new QueryClient()}>
    <KitchenServeApp />
  </QueryClientProvider>
);
