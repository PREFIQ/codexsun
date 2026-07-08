import { createApiApp, registerHealthRoute, registerRequestLogging } from "@codexsun/framework/api";
import type { HealthCheck } from "@codexsun/framework/health";
import { registerAuthRoutes } from "./auth/auth.routes.js";
import { tenantModule } from "./modules/tenant/index.js";
import { env } from "./env.js";

export async function createApp() {
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
          modules: [tenantModule.key],
          runtime: "platform-foundation"
        },
        status: "ok"
      })
    }
  ];

  registerRequestLogging(app);
  registerHealthRoute(app, healthChecks);
  await registerAuthRoutes(app);
  await tenantModule.register(app);

  return app;
}
