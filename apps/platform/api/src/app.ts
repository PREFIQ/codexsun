import { createApiApp, registerHealthRoute } from "@codexsun/framework/api";
import type { HealthCheck } from "@codexsun/framework/health";
import { registerAuthRoutes } from "./auth/routes.js";
import { bootstrapDatabases } from "./db/bootstrap.js";
import { getDatabaseShutdownHooks } from "./db/shutdown.js";
import { env } from "./env.js";

export async function createApp() {
  let dbStatus = {
    masterDatabase: env.DB_MASTER_NAME,
    ready: false,
    tenantTestDatabase: env.TENANT_TEST_DB_NAME
  };

  const app = await createApiApp({
    appName: "CODEXSUN Platform API",
    cookieSecret: env.JWT_SECRET,
    corsOrigins: [env.PLATFORM_WEB_ORIGIN, "http://localhost:4200", "http://127.0.0.1:4200"],
    environment: env.NODE_ENV,
    shutdownHooks: getDatabaseShutdownHooks(),
    onReady: async () => {
      dbStatus = await bootstrapDatabases();
      if (!dbStatus.ready) {
        app.log.warn({ database: dbStatus }, "Database bootstrap is degraded");
      }
    }
  });

  const healthChecks: HealthCheck[] = [
    {
      name: "platform-api",
      check: () => ({
        details: {
          database: dbStatus
        },
        status: dbStatus.ready ? "ok" : "degraded"
      })
    }
  ];

  registerHealthRoute(app, healthChecks);

  await registerAuthRoutes(app);

  return app;
}
