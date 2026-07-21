#!/usr/bin/env node

import { spawn } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const services = {
  "platform-api": { color: "\x1b[36m", label: "api", preflight: "platform-api" },
  "platform-web": { color: "\x1b[32m", label: "web", preflight: "platform-web" }
};
const serviceNames = ["platform-api", "platform-web"];

const reset = "\x1b[0m";
const children = new Set();

console.log("\nCODEXSUN Platform runtime");
for (const serviceName of serviceNames) {
  console.log(`  - ${services[serviceName].label}`);
  startService(serviceName);
}
console.log("");

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => {
    stopChildren();
    process.exit(0);
  });
}

function startService(serviceName) {
  const service = services[serviceName];
  const child = spawn(process.execPath, ["tools/preflight.mjs", service.preflight], {
    cwd: root,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"]
  });

  children.add(child);
  child.stdout.on("data", (chunk) => writeServiceLines(service, chunk));
  child.stderr.on("data", (chunk) => writeServiceLines(service, chunk));
  child.on("exit", (code) => {
    children.delete(child);
    if (code && code !== 0) {
      console.error(`${service.color}[${service.label}]${reset} exited with code ${code}`);
      stopChildren(child);
      process.exit(code);
    }
  });
}

function writeServiceLines(service, chunk) {
  for (const rawLine of String(chunk).split(/\r?\n/u)) {
    const line = rawLine.replace(/\u001b\[[0-9;]*m/gu, "").trim();
    if (line) process.stdout.write(`${service.color}[${service.label}]${reset} ${line}\n`);
  }
}

function stopChildren(skipChild) {
  for (const child of children) {
    if (child === skipChild || child.killed || !child.pid) continue;
    if (process.platform === "win32") {
      spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" });
    } else {
      child.kill("SIGTERM");
    }
  }
}
