import { createApiApp, registerHealthRoute, registerRequestLogging } from "@codexsun/framework/api";
import type { HealthCheck } from "@codexsun/framework/health";
import { bootstrapCoreDatabase } from "./database/core-database.js";
import { env } from "./env.js";
import { countryModule } from "./modules/country/index.js";

export async function createApp() {
  await bootstrapCoreDatabase();

  const app = await createApiApp({
    appName: "CODEXSUN Core API",
    cookieSecret: env.JWT_SECRET,
    corsOrigins: [env.CORE_WEB_ORIGIN],
    environment: env.NODE_ENV
  });

  const healthChecks: HealthCheck[] = [
    {
      name: "core-api",
      check: () => ({
        details: {
          modules: [countryModule.key],
          runtime: "core-foundation"
        },
        status: "ok"
      })
    }
  ];

  registerRequestLogging(app);
  registerHealthRoute(app, healthChecks);
  await countryModule.register(app);

  return app;
}
