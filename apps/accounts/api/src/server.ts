import { registerGracefulShutdown, startApiServer } from "@codexsun/framework/api";
import { createApp } from "./app.js";
import { env } from "./env.js";

const app = await createApp();
registerGracefulShutdown(app);
await startApiServer({
  app,
  host: env.ACCOUNTS_API_HOST,
  port: env.ACCOUNTS_API_PORT,
  readyLabel: "  ok Accounts API ready: {address}"
});
