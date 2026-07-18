import React from "react";
import { createRoot } from "react-dom/client";
import "@codexsun/ui/styles.css";
import { SitesWebApp } from "../runtime/SitesWebApp";

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <SitesWebApp />
  </React.StrictMode>
);
