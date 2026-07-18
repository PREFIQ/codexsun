import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const configDir = fileURLToPath(new URL(".", import.meta.url));
const rootPackage = JSON.parse(
  readFileSync(resolve(configDir, "../../../package.json"), "utf8")
) as { version: string };
const clientKeys = new Set(["codexsun", "logicx", "techmedia"]);

export default defineConfig(({ mode }) => {
  const clientKey = clientKeys.has(mode) ? mode : "codexsun";

  return {
    build: {
      chunkSizeWarningLimit: 1200,
      emptyOutDir: true,
      outDir: `../../../dist/apps/sites/web/${clientKey}`
    },
    cacheDir: `../../../node_modules/.vite/sites-web-${clientKey}`,
    define: {
      __APP_VERSION__: JSON.stringify(rootPackage.version),
      __SITE_CLIENT__: JSON.stringify(clientKey)
    },
    plugins: [tailwindcss(), react()],
    resolve: {
      alias: {
        "@site-client-entry": resolve(configDir, `clients/${clientKey}/site.tsx`)
      }
    },
    server: {
      host: "127.0.0.1",
      port: Number(process.env.SITES_WEB_PORT || 7030)
    }
  };
});
