import { createApiApp, registerHealthRoute, registerRequestLogging } from "@codexsun/framework/api";
import type { HealthCheck } from "@codexsun/framework/health";
import { bootstrapBillingDatabase } from "./database/billing-database.js";
import { env } from "./env.js";
import { salesModule } from "./modules/sales/index.js";

export async function createApp() {
  await bootstrapBillingDatabase();

  const app = await createApiApp({
    appName: "CODEXSUN Billing API",
    cookieSecret: env.JWT_SECRET,
    corsOrigins: [env.BILLING_WEB_ORIGIN],
    environment: env.NODE_ENV
  });

  const healthChecks: HealthCheck[] = [
    {
      name: "billing-api",
      check: () => ({
        details: {
          modules: [salesModule.key],
          runtime: "billing-foundation"
        },
        status: "ok"
      })
    }
  ];

  registerRequestLogging(app);
  registerHealthRoute(app, healthChecks);
  await salesModule.register(app);

  return app;
}
