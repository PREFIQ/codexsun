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
import { storageManagerModule } from "./modules/storage-manager/index.js";
import { projectManagerModule } from "./modules/project-manager/index.js";
import { startQueueManagerWorker } from "./modules/queue-manager/queue-manager.runtime.js";
import { seedDefaultTenant } from "./modules/tenant/tenant.seed.js";
import { env } from "./env.js";
import { bootstrapPlatformDatabase, closePlatformDatabase } from "./database/platform-database.js";
import { closeAllTenantDatabases } from "./database/tenant-database.js";

export async function createApp() {
  console.info("[platform.boot] bootstrap started");
  await bootstrapPlatformDatabase();
  await seedDefaultTenant();

  const app = await createApiApp({
    appName: "CODEXSUN Platform API",
    cookieSecret: env.JWT_SECRET,
    corsOrigins: [env.PLATFORM_WEB_ORIGIN],
    environment: env.NODE_ENV,
    shutdownHooks: [
      async () => {
        console.info("[shutdown] closing tenant MariaDB pools");
        await closeAllTenantDatabases();
      },
      async () => {
        console.info("[shutdown] closing platform MariaDB pools");
        await closePlatformDatabase();
      }
    ]
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
            queueManagerModule.key,
            storageManagerModule.key,
            projectManagerModule.key
          ],
          runtime: "platform-foundation"
        },
        status: "ok"
      })
    }
  ];

  registerRequestLogging(app);
  registerHealthRoute(app, healthChecks);
  console.info("[platform.routes] health ready");
  await registerAuthRoutes(app);
  console.info("[platform.routes] auth ready");
  await registerPlatformModule(appRegistryModule.key, () => appRegistryModule.register(app));
  await registerPlatformModule(tenantModule.key, () => tenantModule.register(app));
  await registerPlatformModule(tenantDomainModule.key, () => tenantDomainModule.register(app));
  await registerPlatformModule(planModule.key, () => planModule.register(app));
  await registerPlatformModule(subscriptionModule.key, () => subscriptionModule.register(app));
  await registerPlatformModule(industryModule.key, () => industryModule.register(app));
  await registerPlatformModule(entitlementModule.key, () => entitlementModule.register(app));
  await registerPlatformModule(accessControlModule.key, () => accessControlModule.register(app));
  await registerPlatformModule(platformActivityModule.key, () => platformActivityModule.register(app));
  await registerPlatformModule(databaseMaintenanceModule.key, () => databaseMaintenanceModule.register(app));
  await registerPlatformModule(queueManagerModule.key, () => queueManagerModule.register(app));
  await registerPlatformModule(storageManagerModule.key, () => storageManagerModule.register(app));
  await registerPlatformModule(projectManagerModule.key, () => projectManagerModule.register(app));
  startQueueManagerWorker(app);
  console.info("[platform.worker] queue manager ready");
  console.info("[platform.boot] bootstrap completed");

  return app;
}

async function registerPlatformModule(key: string, register: () => Promise<unknown> | unknown) {
  console.info(`[module.register] ${key}`);
  await register();
  console.info(`[module.ready] ${key}`);
}
