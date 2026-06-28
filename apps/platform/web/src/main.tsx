import { RouterProvider, createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { Dashboard01 } from "@codexsun/ui";
import React from "react";
import { createRoot } from "react-dom/client";
import "@codexsun/ui/styles.css";
import "./styles.css";
import { AdminDesk } from "./pages/AdminDesk";
import { PageTitle } from "./components/PageTitle";
import { HealthPage } from "./pages/HealthPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { SaDesk } from "./pages/SaDesk";
import { TenantDesk } from "./pages/TenantDesk";

const rootRoute = createRootRoute();

const homeRoute = createRoute({
  component: HomePage,
  getParentRoute: () => rootRoute,
  path: "/"
});

const healthRoute = createRoute({
  component: HealthPage,
  getParentRoute: () => rootRoute,
  path: "/status"
});

const tenantLoginRoute = createRoute({
  component: () => <LoginPage desk="tenant" title="Tenant Login" />,
  getParentRoute: () => rootRoute,
  path: "/login"
});

const saLoginRoute = createRoute({
  component: () => <LoginPage desk="sa" title="Super Admin Login" />,
  getParentRoute: () => rootRoute,
  path: "/sa/login"
});

const adminLoginRoute = createRoute({
  component: () => <LoginPage desk="admin" title="Staff Admin Login" />,
  getParentRoute: () => rootRoute,
  path: "/admin/login"
});

const saRoute = createRoute({
  component: SaDesk,
  getParentRoute: () => rootRoute,
  path: "/sa"
});

const adminRoute = createRoute({
  component: AdminDesk,
  getParentRoute: () => rootRoute,
  path: "/admin"
});

const tenantRoute = createRoute({
  component: TenantDesk,
  getParentRoute: () => rootRoute,
  path: "/tenant"
});

const workspaceRoute = createRoute({
  component: Dashboard01,
  getParentRoute: () => rootRoute,
  path: "/workspace"
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  healthRoute,
  tenantLoginRoute,
  saLoginRoute,
  adminLoginRoute,
  saRoute,
  adminRoute,
  tenantRoute,
  workspaceRoute
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <PageTitle />
    <RouterProvider router={router} />
  </React.StrictMode>
);
