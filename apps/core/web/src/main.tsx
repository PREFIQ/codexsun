import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@codexsun/ui/styles.css";
import "./styles.css";
import { CoreWebApp } from "./app/CoreWebApp";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CoreWebApp />
  </StrictMode>
);
