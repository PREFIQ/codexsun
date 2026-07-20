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
  build: { emptyOutDir: true, outDir: "../../../dist/apps/b2bconnect/web" },
  cacheDir: "../../../node_modules/.vite/b2bconnect-web",
  define: { __APP_VERSION__: JSON.stringify(rootPackage.version) },
  envDir: "../../..",
  plugins: [react(), tailwindcss()],
  ...(command === "serve"
    ? {
        server: {
          host: "127.0.0.1",
          port: requireEnvNumber(process.env.B2BCONNECT_WEB_PORT, "B2BCONNECT_WEB_PORT"),
          proxy: {
            "/api/platform": {
              changeOrigin: false,
              rewrite: (path) => path.replace(/^\/api\/platform/u, "") || "/",
              target: `http://127.0.0.1:${requireEnvNumber(
                process.env.PLATFORM_API_PORT,
                "PLATFORM_API_PORT"
              )}`
            }
          }
        }
      }
    : {})
}));
