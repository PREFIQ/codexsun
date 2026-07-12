import { createApiApp, registerHealthRoute, registerRequestLogging } from "@codexsun/framework/api";
import { env } from "./env.js";
import { registerMigrationManagerRoutes } from "./modules/migration-manager/migration-manager.routes.js";
import { registerDiscoverySnapshotRoutes } from "./modules/discovery-snapshots/discovery-snapshots.routes.js";
import { registerMappingsTransformsRoutes } from "./modules/mappings-transforms/mappings-transforms.routes.js";
import { registerTransformsRoutes } from "./modules/transforms/transforms.routes.js";

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
        details: { modules: [] }
      })
    }
  ]);
  await registerMigrationManagerRoutes(app);
  await registerDiscoverySnapshotRoutes(app);
  await registerMappingsTransformsRoutes(app);
  await registerTransformsRoutes(app);
  return app;
}
