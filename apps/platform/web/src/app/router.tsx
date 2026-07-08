import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { AdminDesk } from "../desks/admin/AdminDesk";
import { SaDesk } from "../desks/sa/SaDesk";
import { AppDesk } from "../desks/tenant/AppDesk";
import { HealthPage } from "../routes/public/HealthPage";
import { HomePage } from "../routes/public/HomePage";
import { LoginPage } from "../routes/public/LoginPage";

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

const routeTree = rootRoute.addChildren([
  homeRoute,
  healthRoute,
  tenantLoginRoute,
  saLoginRoute,
  adminLoginRoute,
  saSplatRoute,
  adminRoute,
  appSplatRoute
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
