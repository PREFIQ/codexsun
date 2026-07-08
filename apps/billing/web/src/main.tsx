import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@codexsun/ui/styles.css";
import "./styles.css";
import { BillingWebApp } from "./app/BillingWebApp";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BillingWebApp />
  </StrictMode>
);
