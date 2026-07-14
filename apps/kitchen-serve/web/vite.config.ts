import { defineConfig } from "vite";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { requireEnvNumber } from "@codexsun/framework/env";
const rootPackage = JSON.parse(
  readFileSync(resolve(import.meta.dirname, "../../../package.json"), "utf8")
) as { version: string };
export default defineConfig(() => ({
  build: {
    emptyOutDir: true,
    outDir: "../../../dist/apps/kitchen-serve/web"
  },
  cacheDir: "../../../node_modules/.vite/kitchen-serve-web",
  define: { __APP_VERSION__: JSON.stringify(rootPackage.version) },
  plugins: [react(), tailwindcss()],
  server: {
    host: "127.0.0.1",
    port: requireEnvNumber(process.env.KITCHEN_SERVE_WEB_PORT, "KITCHEN_SERVE_WEB_PORT")
  }
}));
