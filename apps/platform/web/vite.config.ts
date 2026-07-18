import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { requireEnvNumber } from "@codexsun/framework/env";

const configDir = fileURLToPath(new URL(".", import.meta.url));
const rootPackage = JSON.parse(
  readFileSync(resolve(configDir, "../../../package.json"), "utf8")
) as { version: string };

export default defineConfig(({ command }) => ({
  build: {
    chunkSizeWarningLimit: 900,
    emptyOutDir: true,
    outDir: "../../../dist/apps/platform/web"
  },
  cacheDir: "../../../node_modules/.vite/platform-web",
  envDir: "../../..",
  define: {
    __APP_VERSION__: JSON.stringify(rootPackage.version)
  },
  plugins: [tailwindcss(), react()],
  ...(command === "serve"
    ? {
        server: {
          host: "127.0.0.1",
          port: requireEnvNumber(process.env.PLATFORM_WEB_PORT, "PLATFORM_WEB_PORT"),
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
