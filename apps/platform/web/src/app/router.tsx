import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { lazy } from "react";

const AdminDesk = lazy(() =>
  import("../desks/admin/AdminDesk").then((module) => ({ default: module.AdminDesk }))
);
const SaDesk = lazy(() =>
  import("../desks/sa/SaDesk").then((module) => ({ default: module.SaDesk }))
);
const AppDesk = lazy(() =>
  import("../desks/tenant/AppDesk").then((module) => ({ default: module.AppDesk }))
);
const HealthPage = lazy(() =>
  import("../public/health/HealthPage").then((module) => ({ default: module.HealthPage }))
);
const HomePage = lazy(() =>
  import("../public/HomePage").then((module) => ({ default: module.HomePage }))
);
const LoginPage = lazy(() =>
  import("../public/login/LoginPage").then((module) => ({ default: module.LoginPage }))
);
const DataBridgeDesk = lazy(() =>
  import("../desks/data-bridge/DataBridgeDesk").then((module) => ({
    default: module.DataBridgeDesk
  }))
);

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
  component: () => <LoginPage desk="tenant" title="App Login" />,
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

const saSplatRoute = createRoute({
  component: SaDesk,
  getParentRoute: () => rootRoute,
  path: "/sa/$"
});

const adminRoute = createRoute({
  component: AdminDesk,
  getParentRoute: () => rootRoute,
  path: "/admin"
});

const appSplatRoute = createRoute({
  component: AppDesk,
  getParentRoute: () => rootRoute,
  path: "/app/$"
});

const dataBridgeRoute = createRoute({
  component: DataBridgeDesk,
  getParentRoute: () => rootRoute,
  path: "/data-bridge/$"
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  healthRoute,
  tenantLoginRoute,
  saLoginRoute,
  adminLoginRoute,
  saSplatRoute,
  adminRoute,
  appSplatRoute,
  dataBridgeRoute
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
