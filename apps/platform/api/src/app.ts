import { createApiApp, registerHealthRoute, registerRequestLogging } from "@codexsun/framework/api";
import type { HealthCheck } from "@codexsun/framework/health";
import { registerAuthRoutes } from "./auth/auth.routes.js";
import { appRegistryModule } from "./modules/app-registry/index.js";
import { tenantModule } from "./modules/tenant/index.js";
import { env } from "./env.js";
import { bootstrapPlatformDatabase } from "./database/platform-database.js";
import { seedDefaultTenant } from "./database/default-tenant-seed.js";

export async function createApp() {
  await bootstrapPlatformDatabase();
  await seedDefaultTenant();

  const app = await createApiApp({
    appName: "CODEXSUN Platform API",
    cookieSecret: env.JWT_SECRET,
    corsOrigins: [env.PLATFORM_WEB_ORIGIN],
    environment: env.NODE_ENV
  });

  const healthChecks: HealthCheck[] = [
    {
      name: "platform-api",
      check: () => ({
        details: {
          modules: [appRegistryModule.key, tenantModule.key],
          runtime: "platform-foundation"
        },
        status: "ok"
      })
    }
  ];

  registerRequestLogging(app);
  registerHealthRoute(app, healthChecks);
  await registerAuthRoutes(app);
  await appRegistryModule.register(app);
  await tenantModule.register(app);

  return app;
}
