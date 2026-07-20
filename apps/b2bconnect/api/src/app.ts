import { createApiApp, registerHealthRoute, registerRequestLogging } from "@codexsun/framework/api";
import { b2bConnectAppProfile } from "./config/app-profile.js";
import { b2bConnectIdentityProfile } from "./config/identity-profile.js";
import { createB2bConnectDatabase } from "./database.js";
import { env } from "./env.js";
import { createB2bConnectAdministrationModule } from "./modules/administration/index.js";
import { createB2bConnectAppInfoModule } from "./modules/app-info/index.js";
import { createB2bConnectAuthenticationModule } from "./modules/authentication/index.js";
import { createBusinessProfileModule } from "./modules/business-profile/index.js";
import { createB2bConnectClientPortalModule } from "./modules/client-portal/index.js";
import { createNetworkBlueprintModule } from "./modules/network-blueprint/index.js";
import { createB2bConnectSuperAdministrationModule } from "./modules/super-administration/index.js";

export async function createApp() {
  const database = createB2bConnectDatabase();
  const appInfoModule = createB2bConnectAppInfoModule(b2bConnectAppProfile);
  const authenticationModule = createB2bConnectAuthenticationModule({
    deploymentTenantCode: b2bConnectIdentityProfile.deploymentTenantCode,
    platformJwtSecret: env.JWT_SECRET
  });
  const clientPortalModule = createB2bConnectClientPortalModule(authenticationModule.service);
  const businessProfileModule = createBusinessProfileModule(database, authenticationModule.service);
  const networkBlueprintModule = createNetworkBlueprintModule();
  const administrationModule = createB2bConnectAdministrationModule(authenticationModule.service);
  const superAdministrationModule = createB2bConnectSuperAdministrationModule(
    authenticationModule.service
  );
  const app = await createApiApp({
    appName: `CODEXSUN ${b2bConnectAppProfile.brandName} API`,
    cookieSecret: env.JWT_SECRET,
    corsOrigins: [env.B2BCONNECT_WEB_ORIGIN, env.PLATFORM_WEB_ORIGIN],
    environment: env.NODE_ENV
  });

  registerRequestLogging(app);
  registerHealthRoute(app, [
    {
      name: "b2bconnect-api",
      check: () => ({
        status: "ok",
        details: {
          modules: [
            appInfoModule.key,
            authenticationModule.key,
            businessProfileModule.key,
            clientPortalModule.key,
            networkBlueprintModule.key,
            administrationModule.key,
            superAdministrationModule.key
          ]
        }
      })
    }
  ]);
  await appInfoModule.register(app);
  authenticationModule.register(app);
  clientPortalModule.register(app);
  businessProfileModule.register(app);
  networkBlueprintModule.register(app);
  administrationModule.register(app);
  superAdministrationModule.register(app);
  app.addHook("onClose", () => database.close());

  return app;
}
