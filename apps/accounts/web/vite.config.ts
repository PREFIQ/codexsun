import { defineConfig } from "vite";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { requireEnvNumber } from "@codexsun/framework/env";

const configDir = fileURLToPath(new URL(".", import.meta.url));
const rootPackage = JSON.parse(readFileSync(resolve(configDir, "../../../package.json"), "utf8")) as { version: string };

export default defineConfig(() => ({
  define: { __APP_VERSION__: JSON.stringify(rootPackage.version) },
  plugins: [react(), tailwindcss()],
  server: {
    host: "127.0.0.1",
    port: requireEnvNumber(process.env.ACCOUNTS_WEB_PORT, "ACCOUNTS_WEB_PORT")
  }
}));
