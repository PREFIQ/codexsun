import { createApiApp, registerHealthRoute, registerRequestLogging } from "@codexsun/framework/api";
import { env } from "./env.js";
import { migrationProjectsModule } from "./modules/migration-projects/index.js";

export async function createApp() {
  const app = await createApiApp({
    appName: "CODEXSUN Data Bridge API",
    cookieSecret: env.JWT_SECRET,
    corsOrigins: [env.DATA_BRIDGE_WEB_ORIGIN, env.PLATFORM_WEB_ORIGIN],
    environment: env.NODE_ENV
  });
  registerRequestLogging(app);
  registerHealthRoute(app, [
    {
      name: "data-bridge-api",
      check: () => ({
        status: "ok",
        details: { execution: "approval-gated", modules: [migrationProjectsModule.key] }
      })
    }
  ]);
  await migrationProjectsModule.register(app);
  return app;
}
