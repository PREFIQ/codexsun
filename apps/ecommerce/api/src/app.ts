import { createApiApp, registerHealthRoute, registerRequestLogging } from "@codexsun/framework/api";
import { ecommerceAppProfile } from "./config/app-profile.js";
import { createEcommerceAppInfoModule } from "./modules/app-info/index.js";
import { env } from "./env.js";

export async function createApp() {
  const appInfoModule = createEcommerceAppInfoModule(ecommerceAppProfile);
  const app = await createApiApp({
    appName: `CODEXSUN ${ecommerceAppProfile.brandName} API`,
    cookieSecret: env.JWT_SECRET,
    corsOrigins: [env.ECOMMERCE_WEB_ORIGIN, env.PLATFORM_WEB_ORIGIN],
    environment: env.NODE_ENV
  });

  registerRequestLogging(app);
  registerHealthRoute(app, [
    {
      name: "ecommerce-api",
      check: () => ({ status: "ok", details: { modules: [appInfoModule.key] } })
    }
  ]);
  await appInfoModule.register(app);

  return app;
}
