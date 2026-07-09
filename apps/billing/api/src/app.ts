import { createApiApp, registerHealthRoute, registerRequestLogging } from "@codexsun/framework/api";
import type { HealthCheck } from "@codexsun/framework/health";
import { bootstrapBillingDatabase, closeAllBillingDatabases } from "./database/billing-database.js";
import { env } from "./env.js";
import { quotationModule } from "./modules/quotation/index.js";
import { salesModule } from "./modules/sales/index.js";
import { billingSettingsModule } from "./modules/settings/index.js";

export async function createApp() {
  await bootstrapBillingDatabase();

  const app = await createApiApp({
    appName: "CODEXSUN Billing API",
    cookieSecret: env.JWT_SECRET,
    corsOrigins: [env.BILLING_WEB_ORIGIN],
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
          modules: [salesModule.key, quotationModule.key, billingSettingsModule.key],
          runtime: "billing-foundation"
        },
        status: "ok"
      })
    }
  ];

  registerRequestLogging(app);
  registerHealthRoute(app, healthChecks);
  await salesModule.register(app);
  await quotationModule.register(app);
  await billingSettingsModule.register(app);

  return app;
}
