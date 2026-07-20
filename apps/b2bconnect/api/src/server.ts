import { registerGracefulShutdown, startApiServer } from "@codexsun/framework/api";
import { createApp } from "./app.js";
import { b2bConnectAppProfile } from "./config/app-profile.js";
import { env } from "./env.js";

const app = await createApp();
registerGracefulShutdown(app);
await startApiServer({
  app,
  host: env.API_HOST,
  port: env.B2BCONNECT_API_PORT,
  readyLabel: `  ok ${b2bConnectAppProfile.brandName} API ready: {address}`
});
