import { createApiApp, registerHealthRoute, registerRequestLogging } from "@codexsun/framework/api";
import { closeKitchenServeDatabases } from "./database/kitchen-serve-database.js";
import { env } from "./env.js";
import { serviceOrdersModule } from "./modules/service-orders/index.js";
export async function createApp() {
  const app = await createApiApp({
    appName: "CODEXSUN KitchenServe API",
    cookieSecret: env.JWT_SECRET,
    corsOrigins: [env.KITCHEN_SERVE_WEB_ORIGIN, env.PLATFORM_WEB_ORIGIN],
    environment: env.NODE_ENV,
    shutdownHooks: [closeKitchenServeDatabases]
  });
  registerRequestLogging(app);
  registerHealthRoute(app, [
    {
      name: "kitchen-serve-api",
      check: () => ({ status: "ok", details: { modules: [serviceOrdersModule.key] } })
    }
  ]);
  await serviceOrdersModule.register(app);
  return app;
}
