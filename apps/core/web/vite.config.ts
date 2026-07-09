import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { requireEnvNumber } from "@codexsun/framework/env";

const configDir = fileURLToPath(new URL(".", import.meta.url));
const rootPackage = JSON.parse(readFileSync(resolve(configDir, "../../../package.json"), "utf8")) as { version: string };

export default defineConfig(() => ({
  build: {
    chunkSizeWarningLimit: 900,
    emptyOutDir: true,
    outDir: "../../../dist/apps/core/web",
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, "/");
          if (normalizedId.includes("node_modules/react") || normalizedId.includes("node_modules/react-dom")) return "react";
          if (normalizedId.includes("node_modules/lucide-react")) return "icons";
          if (normalizedId.includes("node_modules/@tanstack")) return "tanstack";
          if (normalizedId.includes("node_modules/@dnd-kit")) return "dnd";
          if (normalizedId.includes("node_modules/framer-motion") || normalizedId.includes("node_modules/motion-")) return "motion";
          if (normalizedId.includes("node_modules/recharts") || normalizedId.includes("node_modules/d3-")) return "charts";
          if (normalizedId.includes("/packages/ui/src/blocks/")) return "ui-blocks";
          if (normalizedId.includes("/packages/ui/src/components/")) return "ui-components";
          if (normalizedId.includes("/packages/ui/src/")) return "codexsun-ui";
        }
      }
    }
  },
  cacheDir: "../../../node_modules/.vite/core-web",
  define: {
    __APP_VERSION__: JSON.stringify(rootPackage.version)
  },
  plugins: [tailwindcss(), react()],
  server: {
    headers: {
      "Permissions-Policy": "unload=*"
    },
    host: "127.0.0.1",
    port: requireEnvNumber(process.env.CORE_WEB_PORT, "CORE_WEB_PORT")
  }
}));
