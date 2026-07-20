import { EcommerceLandingPage } from "../public";
import { EcommerceApp } from "./EcommerceApp";

export function EcommerceWeb() {
  const path = window.location.pathname.replace(/\/+$/u, "") || "/";

  if (path === "/app" || path === "/dashboard" || path.startsWith("/app/")) {
    return <EcommerceApp />;
  }

  return <EcommerceLandingPage />;
}
