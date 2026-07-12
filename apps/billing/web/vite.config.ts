import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { requireEnvNumber } from "@codexsun/framework/env";

const configDir = fileURLToPath(new URL(".", import.meta.url));
const rootPackage = JSON.parse(
  readFileSync(resolve(configDir, "../../../package.json"), "utf8")
) as { version: string };

export default defineConfig(() => ({
  build: {
    chunkSizeWarningLimit: 900,
    emptyOutDir: true,
    outDir: "../../../dist/apps/billing/web",
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, "/");
          if (
            normalizedId.includes("node_modules/react") ||
            normalizedId.includes("node_modules/react-dom")
          )
            return "react";
          if (normalizedId.includes("node_modules/lucide-react")) return "icons";
          if (normalizedId.includes("node_modules/@tanstack")) return "tanstack";
          if (normalizedId.includes("node_modules/@dnd-kit")) return "dnd";
          if (
            normalizedId.includes("node_modules/framer-motion") ||
            normalizedId.includes("node_modules/motion-")
          )
            return "motion";
          if (
            normalizedId.includes("node_modules/recharts") ||
            normalizedId.includes("node_modules/d3-")
          )
            return "charts";
          if (normalizedId.includes("/packages/ui/src/workspace/")) return "ui-workspace";
          if (normalizedId.includes("/packages/ui/src/design-system/")) return "ui-design-system";
          if (normalizedId.includes("/packages/ui/src/blocks/")) return "ui-blocks";
          if (normalizedId.includes("/packages/ui/src/layouts/")) return "ui-layouts";
          if (
            normalizedId.includes("/packages/ui/src/components/dialog") ||
            normalizedId.includes("/packages/ui/src/components/drawer") ||
            normalizedId.includes("/packages/ui/src/components/dropdown-menu") ||
            normalizedId.includes("/packages/ui/src/components/hover-card") ||
            normalizedId.includes("/packages/ui/src/components/menubar") ||
            normalizedId.includes("/packages/ui/src/components/navigation-menu") ||
            normalizedId.includes("/packages/ui/src/components/popover") ||
            normalizedId.includes("/packages/ui/src/components/select") ||
            normalizedId.includes("/packages/ui/src/components/sheet") ||
            normalizedId.includes("/packages/ui/src/components/tabs") ||
            normalizedId.includes("/packages/ui/src/components/toast") ||
            normalizedId.includes("/packages/ui/src/components/toaster") ||
            normalizedId.includes("/packages/ui/src/components/sonner") ||
            normalizedId.includes("/packages/ui/src/components/tooltip")
          )
            return "ui-overlays";
          if (
            normalizedId.includes("/packages/ui/src/components/calendar") ||
            normalizedId.includes("/packages/ui/src/components/carousel") ||
            normalizedId.includes("/packages/ui/src/components/chart") ||
            normalizedId.includes("/packages/ui/src/components/pagination") ||
            normalizedId.includes("/packages/ui/src/components/progress") ||
            normalizedId.includes("/packages/ui/src/components/resizable") ||
            normalizedId.includes("/packages/ui/src/components/scroll-area") ||
            normalizedId.includes("/packages/ui/src/components/skeleton") ||
            normalizedId.includes("/packages/ui/src/components/table")
          )
            return "ui-data";
          if (
            normalizedId.includes("/packages/ui/src/components/") ||
            normalizedId.includes("/packages/ui/src/lib/")
          )
            return "codexsun-ui";
        }
      }
    }
  },
  cacheDir: "../../../node_modules/.vite/billing-web",
  define: {
    __APP_VERSION__: JSON.stringify(rootPackage.version)
  },
  plugins: [tailwindcss(), react()],
  server: {
    host: "127.0.0.1",
    port: requireEnvNumber(process.env.BILLING_WEB_PORT, "BILLING_WEB_PORT")
  }
}));
