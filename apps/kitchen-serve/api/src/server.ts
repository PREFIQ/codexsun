import { registerGracefulShutdown, startApiServer } from "@codexsun/framework/api";
import { createApp } from "./app.js";
import { env } from "./env.js";
const app = await createApp();
registerGracefulShutdown(app);
await startApiServer({
  app,
  host: env.API_HOST,
  port: env.KITCHEN_SERVE_API_PORT,
  readyLabel: "  ok KitchenServe API ready: {address}"
});
