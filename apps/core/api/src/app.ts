import { createApiApp, registerHealthRoute, registerRequestLogging } from "@codexsun/framework/api";
import type { HealthCheck } from "@codexsun/framework/health";
import { bootstrapCoreDatabase, closeCoreDatabase } from "./database/core-database.js";
import { env } from "./env.js";
import { commonModule } from "./modules/common/index.js";
import { locationModules } from "./modules/common/location/location.module.js";
import { entriesModule } from "./modules/entries/index.js";

export async function createApp() {
  await bootstrapCoreDatabase();

  const app = await createApiApp({
    appName: "CODEXSUN Core API",
    cookieSecret: env.JWT_SECRET,
    corsOrigins: [env.CORE_WEB_ORIGIN, env.PLATFORM_WEB_ORIGIN],
    environment: env.NODE_ENV,
    shutdownHooks: [
      async () => {
        console.info("[shutdown] closing core MariaDB pools");
        await closeCoreDatabase();
      }
    ]
  });

  const healthChecks: HealthCheck[] = [
    {
      name: "core-api",
      check: () => ({
        details: {
          modules: [commonModule.key, entriesModule.key, ...locationModules.map((module) => module.key)],
          runtime: "core-foundation"
        },
        status: "ok"
      })
    }
  ];

  registerRequestLogging(app);
  registerHealthRoute(app, healthChecks);
  await commonModule.register(app);
  await entriesModule.register(app);

  return app;
}
