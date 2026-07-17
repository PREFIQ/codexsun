import {
  createApiApp,
  registerHealthRoute,
  registerRequestLogging,
  requireTenantAccess
} from "@codexsun/framework/api";
import type { HealthCheck } from "@codexsun/framework/health";
import { authorizeBillingRequest } from "./auth/tenant-permission.js";
import { runWithBillingScope } from "./auth/billing-scope.js";
import {
  closeAllBillingDatabases,
  resolveBillingDatabaseName
} from "./database/billing-database.js";
import { env } from "./env.js";
import { exportSalesModule } from "./modules/export-sales/index.js";
import { purchaseModule } from "./modules/purchase/index.js";
import { paymentModule } from "./modules/payment/index.js";
import { quotationModule } from "./modules/quotation/index.js";
import { salesModule } from "./modules/sales/index.js";
import { receiptModule } from "./modules/receipt/index.js";
import { billingSettingsModule } from "./modules/settings/index.js";
import { dashboardModule } from "./modules/dashboard/index.js";
import { billingReportsModule } from "./modules/reports/index.js";

export async function createApp() {
  const app = await createApiApp({
    appName: "CODEXSUN Billing API",
    cookieSecret: env.JWT_SECRET,
    corsOrigins: [env.BILLING_WEB_ORIGIN, env.PLATFORM_WEB_ORIGIN],
    environment: env.NODE_ENV,
    shutdownHooks: [
      async () => {
        console.info("[shutdown] closing billing MariaDB pools");
        await closeAllBillingDatabases();
      }
    ]
  });

  const healthChecks: HealthCheck[] = [
    {
      name: "billing-api",
      check: () => ({
        details: {
          modules: [
            salesModule.key,
            purchaseModule.key,
            exportSalesModule.key,
            quotationModule.key,
            paymentModule.key,
            receiptModule.key,
            billingSettingsModule.key,
            dashboardModule.key,
            billingReportsModule.key
          ],
          runtime: "billing-foundation"
        },
        status: "ok"
      })
    }
  ];

  registerRequestLogging(app);
  registerHealthRoute(app, healthChecks);
  app.addHook("onRequest", (request, _reply, done) => {
    if (!request.url.startsWith("/billing/")) return done();
    runWithBillingScope(request, done);
  });
  app.addHook("preHandler", async (request) => {
    if (!request.url.startsWith("/billing/")) return;
    const requestedDatabase = request.headers["x-tenant-db"];
    const tenantDatabase = resolveBillingDatabaseName(
      Array.isArray(requestedDatabase) ? requestedDatabase[0] : requestedDatabase
    );
    const claims = requireTenantAccess({
      authorization: request.headers.authorization,
      secret: env.JWT_SECRET,
      tenantDatabase,
      tenantId: request.headers["x-tenant-id"]
    });
    await authorizeBillingRequest(request, tenantDatabase, claims.email ?? "");
  });
  await salesModule.register(app);
  await purchaseModule.register(app);
  await exportSalesModule.register(app);
  await quotationModule.register(app);
  await paymentModule.register(app);
  await receiptModule.register(app);
  await billingSettingsModule.register(app);
  await dashboardModule.register(app);
  await billingReportsModule.register(app);
  return app;
}
