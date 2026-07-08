#!/usr/bin/env node

import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const installDirectory = resolve(process.env.INIT_CWD ?? process.cwd());

if (installDirectory !== root) {
  console.error("Dependencies must be installed from the repository root.");
  console.error(`Run: cd "${root}" && npm install`);
  process.exit(1);
}
