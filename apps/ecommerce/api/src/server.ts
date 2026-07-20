import { registerGracefulShutdown, startApiServer } from "@codexsun/framework/api";
import { createApp } from "./app.js";
import { ecommerceAppProfile } from "./config/app-profile.js";
import { env } from "./env.js";

const app = await createApp();
registerGracefulShutdown(app);
await startApiServer({
  app,
  host: env.API_HOST,
  port: env.ECOMMERCE_API_PORT,
  readyLabel: `  ok ${ecommerceAppProfile.brandName} API ready: {address}`
});
