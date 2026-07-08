import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { BillingHomePage } from "../routes/BillingHomePage";
import { SalesPage } from "../modules/sales/sales.page";

const rootRoute = createRootRoute();

const homeRoute = createRoute({
  component: BillingHomePage,
  getParentRoute: () => rootRoute,
  path: "/"
});

const billingRoute = createRoute({
  component: SalesPage,
  getParentRoute: () => rootRoute,
  path: "/billing"
});

const salesRoute = createRoute({
  component: SalesPage,
  getParentRoute: () => rootRoute,
  path: "/billing/sales"
});

const routeTree = rootRoute.addChildren([homeRoute, billingRoute, salesRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
