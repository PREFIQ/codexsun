import { createApiApp, registerHealthRoute, registerRequestLogging } from "@codexsun/framework/api";
import type { HealthCheck } from "@codexsun/framework/health";
import { bootstrapBillingDatabase, closeAllBillingDatabases } from "./database/billing-database.js";
import { env } from "./env.js";
import { entriesModule } from "./modules/entries/index.js";
import { exportSalesModule } from "./modules/export-sales/index.js";
import { purchaseModule } from "./modules/purchase/index.js";
import { quotationModule } from "./modules/quotation/index.js";
import { salesModule } from "./modules/sales/index.js";
import { billingSettingsModule } from "./modules/settings/index.js";

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
          modules: [entriesModule.key, salesModule.key, purchaseModule.key, exportSalesModule.key, quotationModule.key, billingSettingsModule.key],
          runtime: "billing-foundation"
        },
        status: "ok"
      })
    }
  ];

  registerRequestLogging(app);
  registerHealthRoute(app, healthChecks);
  await entriesModule.register(app);
  await salesModule.register(app);
  await purchaseModule.register(app);
  await exportSalesModule.register(app);
  await quotationModule.register(app);
  await billingSettingsModule.register(app);
  void bootstrapBillingDatabase()
    .then(() => {
      console.info("[billing.boot] database bootstrap completed");
    })
    .catch((error: unknown) => {
      console.error("[billing.boot] database bootstrap failed", error);
    });

  return app;
}
