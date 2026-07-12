import { createApiApp, registerHealthRoute, registerRequestLogging } from "@codexsun/framework/api";
import { env } from "./env.js";
import { createDatabasePool } from "@codexsun/framework/db";
import { registerMigrationManagerRoutes } from "./modules/migration-manager/migration-manager.routes.js";
import { registerDiscoverySnapshotRoutes } from "./modules/discovery-snapshots/discovery-snapshots.routes.js";

export async function createApp() {
  const app = await createApiApp({
    appName: "CODEXSUN Data Bridge API",
    cookieSecret: env.JWT_SECRET,
    corsOrigins: [env.DATA_BRIDGE_WEB_ORIGIN, env.PLATFORM_WEB_ORIGIN],
    environment: env.NODE_ENV
  });
  registerRequestLogging(app);
  const database = createDatabasePool({
    database: env.DB_MASTER_NAME,
    host: env.DB_HOST,
    password: env.DB_PASSWORD,
    port: env.DB_PORT,
    user: env.DB_USER
  });
  app.addHook("onClose", async () => database.end());
  registerHealthRoute(app, [
    {
      name: "data-bridge-api",
      check: () => ({
        status: "ok",
        details: { modules: [] }
      })
    }
  ]);
  await registerMigrationManagerRoutes(app, database);
  await registerDiscoverySnapshotRoutes(app, database);
  return app;
}
