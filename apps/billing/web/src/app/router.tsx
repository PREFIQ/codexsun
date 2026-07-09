import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { QuotationPage } from "../modules/quotation";
import { SalesPage } from "../modules/sales/sales.page";
import { SalesPrintRoutePage } from "../modules/sales/sales.print";
import { SalesSettingsPage } from "../modules/settings";

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

const quotationRoute = createRoute({
  component: QuotationPage,
  getParentRoute: () => rootRoute,
  path: "/billing/quotation"
});

const salesPrintRoute = createRoute({
  component: SalesPrintRoutePage,
  getParentRoute: () => rootRoute,
  path: "/billing/sales/print"
});

const salesSettingsRoute = createRoute({
  component: SalesSettingsPage,
  getParentRoute: () => rootRoute,
  path: "/billing/settings/sales"
});

const routeTree = rootRoute.addChildren([homeRoute, billingRoute, salesRoute, quotationRoute, salesPrintRoute, salesSettingsRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
