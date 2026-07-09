import { createApiApp, registerHealthRoute, registerRequestLogging } from "@codexsun/framework/api";
import type { HealthCheck } from "@codexsun/framework/health";
import { bootstrapAccountsDatabase, closeAllAccountsDatabases } from "./database/accounts-database.js";
import { env } from "./env.js";
import { ledgersModule } from "./modules/ledgers/index.js";
import { vouchersModule } from "./modules/vouchers/index.js";
import { reportsModule } from "./modules/reports/index.js";
import { accountsSettingsModule } from "./modules/settings/index.js";

export async function createApp() {
  await bootstrapAccountsDatabase();

  const app = await createApiApp({
    appName: "CODEXSUN Accounts API",
    cookieSecret: env.JWT_SECRET,
    corsOrigins: [env.ACCOUNTS_WEB_ORIGIN, env.PLATFORM_WEB_ORIGIN],
    environment: env.NODE_ENV,
    shutdownHooks: [
      async () => {
        console.info("[shutdown] closing accounts MariaDB pools");
        await closeAllAccountsDatabases();
      }
    ]
  });

  const healthChecks: HealthCheck[] = [
    {
      name: "accounts-api",
      check: () => ({
        details: {
          modules: [ledgersModule.key, vouchersModule.key, reportsModule.key, accountsSettingsModule.key],
          runtime: "accounts-foundation"
        },
        status: "ok"
      })
    }
  ];

  registerRequestLogging(app);
  registerHealthRoute(app, healthChecks);
  await ledgersModule.register(app);
  await vouchersModule.register(app);
  await reportsModule.register(app);
  await accountsSettingsModule.register(app);

  return app;
}
