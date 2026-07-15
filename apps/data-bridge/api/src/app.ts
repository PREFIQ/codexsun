import { createApiApp, registerHealthRoute, registerRequestLogging } from "@codexsun/framework/api";
import { env } from "./env.js";
import { registerMigrationManagerModule } from "./modules/migration-manager/index.js";
import { registerDiscoverySnapshotsModule } from "./modules/discovery-snapshots/index.js";
import { registerMappingsTransformsModule } from "./modules/mappings-transforms/index.js";
import { registerTransformsModule } from "./modules/transforms/index.js";
import { registerReviewApprovalsModule } from "./modules/review-approvals/index.js";
import { registerExecutionRunsModule } from "./modules/execution-runs/index.js";
import { registerReconciliationAuditModule } from "./modules/reconciliation-audit/index.js";

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
  await registerMigrationManagerModule(app);
  await registerDiscoverySnapshotsModule(app);
  await registerMappingsTransformsModule(app);
  await registerTransformsModule(app);
  await registerReviewApprovalsModule(app);
  await registerExecutionRunsModule(app);
  await registerReconciliationAuditModule(app);
  return app;
}
