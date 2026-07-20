import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { requireEnvNumber } from "@codexsun/framework/env";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const rootPackage = JSON.parse(
  readFileSync(resolve(import.meta.dirname, "../../../package.json"), "utf8")
) as { version: string };

export default defineConfig(({ command }) => ({
  build: { emptyOutDir: true, outDir: "../../../dist/apps/ecommerce/web" },
  cacheDir: "../../../node_modules/.vite/ecommerce-web",
  define: { __APP_VERSION__: JSON.stringify(rootPackage.version) },
  envDir: "../../..",
  plugins: [react(), tailwindcss()],
  ...(command === "serve"
    ? {
        server: {
          host: "127.0.0.1",
          port: requireEnvNumber(process.env.ECOMMERCE_WEB_PORT, "ECOMMERCE_WEB_PORT")
        }
      }
    : {})
}));
