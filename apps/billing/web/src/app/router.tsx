import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { ExportSalesPage } from "../modules/export-sales/export-sales.page";
import { ExportSalesPrintRoutePage } from "../modules/export-sales/export-sales.print";
import { PurchasePage } from "../modules/purchase/purchase.page";
import { PurchasePrintRoutePage } from "../modules/purchase/purchase.print";
import { PaymentPage } from "../modules/payment";
import { ReceiptPage } from "../modules/receipt";
import { QuotationPage } from "../modules/quotation";
import { SalesPage } from "../modules/sales/sales.page";
import { SalesPrintRoutePage } from "../modules/sales/sales.print";
import {
  BillingSettingsWorkspace,
  DocumentSettingsWorkspace,
  SalesSettingsPage
} from "../modules/settings";

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

const purchaseRoute = createRoute({
  component: PurchasePage,
  getParentRoute: () => rootRoute,
  path: "/billing/purchase"
});

const purchasePrintRoute = createRoute({
  component: PurchasePrintRoutePage,
  getParentRoute: () => rootRoute,
  path: "/billing/purchase/print"
});

const paymentRoute = createRoute({
  component: PaymentPage,
  getParentRoute: () => rootRoute,
  path: "/billing/payment"
});
const receiptRoute = createRoute({
  component: ReceiptPage,
  getParentRoute: () => rootRoute,
  path: "/billing/receipt"
});

const exportSalesRoute = createRoute({
  component: ExportSalesPage,
  getParentRoute: () => rootRoute,
  path: "/billing/export-sales"
});

const exportSalesPrintRoute = createRoute({
  component: ExportSalesPrintRoutePage,
  getParentRoute: () => rootRoute,
  path: "/billing/export-sales/print"
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

const billingSettingsRoute = createRoute({
  component: BillingSettingsWorkspace,
  getParentRoute: () => rootRoute,
  path: "/billing/settings"
});

const documentSettingsRoute = createRoute({
  component: DocumentSettingsWorkspace,
  getParentRoute: () => rootRoute,
  path: "/billing/settings/documents"
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  billingRoute,
  salesRoute,
  quotationRoute,
  purchaseRoute,
  purchasePrintRoute,
  paymentRoute,
  receiptRoute,
  exportSalesRoute,
  exportSalesPrintRoute,
  salesPrintRoute,
  salesSettingsRoute,
  billingSettingsRoute,
  documentSettingsRoute
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
