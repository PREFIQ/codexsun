import {
  createApiApp,
  registerHealthRoute,
  registerRequestLogging,
  requireTenantAccess
} from "@codexsun/framework/api";
import type { HealthCheck } from "@codexsun/framework/health";
import { authorizeCoreRequest } from "./auth/tenant-permission.js";
import {
  bootstrapCoreDatabase,
  closeCoreDatabase,
  resolveCoreDatabaseName,
  runWithCoreDatabase
} from "./database/core-database.js";
import { env } from "./env.js";
import { commonModule } from "./modules/common/index.js";
import { locationModules } from "./modules/common/location/location.module.js";
import { masterModule } from "./modules/master/index.js";
import { organisationModule } from "./modules/organisation/index.js";

export async function createApp() {
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
          modules: [
            commonModule.key,
            organisationModule.key,
            masterModule.key,
            ...locationModules.map((module) => module.key)
          ],
          runtime: "core-foundation"
        },
        status: "ok"
      })
    }
  ];

  registerRequestLogging(app);
  registerHealthRoute(app, healthChecks);
  app.addHook("onRequest", (request, _reply, done) => {
    if (request.url === "/health" || request.url === "/") return done();
    try {
      const value = request.headers["x-tenant-db"];
      const databaseName = resolveCoreDatabaseName(Array.isArray(value) ? value[0] : value);
      runWithCoreDatabase(databaseName, done);
    } catch (error) {
      done(error as Error);
    }
  });
  app.addHook("preHandler", async (request) => {
    if (request.url === "/health" || request.url === "/") return;
    const value = request.headers["x-tenant-db"];
    const tenantDatabase = resolveCoreDatabaseName(Array.isArray(value) ? value[0] : value);
    const claims = requireTenantAccess({
      authorization: request.headers.authorization,
      secret: env.JWT_SECRET,
      tenantDatabase,
      tenantId: request.headers["x-tenant-id"]
    });
    await bootstrapCoreDatabase(tenantDatabase);
    await authorizeCoreRequest(request, tenantDatabase, claims.email ?? "");
  });
  await commonModule.register(app);
  await organisationModule.register(app);
  await masterModule.register(app);

  return app;
}
