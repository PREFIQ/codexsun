import { createApiApp, registerHealthRoute, registerRequestLogging } from "@codexsun/framework/api";
import type { HealthCheck } from "@codexsun/framework/health";
import { registerAuthRoutes } from "./auth/auth.routes.js";
import { appRegistryModule } from "./modules/app-registry/index.js";
import { tenantDomainModule } from "./modules/tenant-domain/index.js";
import { tenantModule } from "./modules/tenant/index.js";
import { planModule } from "./modules/plan/index.js";
import { subscriptionModule } from "./modules/subscription/index.js";
import { industryModule } from "./modules/industry/index.js";
import { entitlementModule } from "./modules/entitlement/index.js";
import { accessControlModule } from "./modules/access-control/index.js";
import { platformActivityModule } from "./modules/platform-activity/index.js";
import { databaseMaintenanceModule } from "./modules/database-maintenance/index.js";
import { queueManagerModule } from "./modules/queue-manager/index.js";
import { seedDefaultTenant } from "./modules/tenant/tenant.seed.js";
import { env } from "./env.js";
import { bootstrapPlatformDatabase } from "./database/platform-database.js";

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
          modules: [
            appRegistryModule.key,
            tenantModule.key,
            tenantDomainModule.key,
            planModule.key,
            subscriptionModule.key,
            industryModule.key,
            entitlementModule.key,
            accessControlModule.key,
            platformActivityModule.key,
            databaseMaintenanceModule.key,
            queueManagerModule.key
          ],
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
  await tenantDomainModule.register(app);
  await planModule.register(app);
  await subscriptionModule.register(app);
  await industryModule.register(app);
  await entitlementModule.register(app);
  await accessControlModule.register(app);
  await platformActivityModule.register(app);
  await databaseMaintenanceModule.register(app);
  await queueManagerModule.register(app);

  return app;
}
