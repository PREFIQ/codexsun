import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DataBridgeApp } from "./app/DataBridgeApp";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={new QueryClient()}>
    <DataBridgeApp />
  </QueryClientProvider>
);
