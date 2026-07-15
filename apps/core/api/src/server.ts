import { registerGracefulShutdown, startApiServer } from "@codexsun/framework/api";
import { createApp } from "./app.js";
import { env } from "./env.js";

const app = await createApp();
registerGracefulShutdown(app);
await startApiServer({
  app,
  host: env.API_HOST,
  port: env.CORE_API_PORT,
  readyLabel: "  ok Core API ready: {address}"
});
