import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { requireEnvNumber } from "@codexsun/framework/env";

export default defineConfig(() => ({
  plugins: [react(), tailwindcss()],
  server: {
    host: "127.0.0.1",
    port: requireEnvNumber(process.env.ACCOUNTS_WEB_PORT, "ACCOUNTS_WEB_PORT")
  }
}));
