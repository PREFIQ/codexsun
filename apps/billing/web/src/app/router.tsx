import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { SalesPage } from "../modules/sales/sales.page";
import { SalesPrintRoutePage } from "../modules/sales/sales.print";

const rootRoute = createRootRoute();

const homeRoute = createRoute({
  component: SalesPage,
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

const salesPrintRoute = createRoute({
  component: SalesPrintRoutePage,
  getParentRoute: () => rootRoute,
  path: "/billing/sales/print"
});

const routeTree = rootRoute.addChildren([homeRoute, billingRoute, salesRoute, salesPrintRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
