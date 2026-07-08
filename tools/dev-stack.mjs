#!/usr/bin/env node

import { spawn } from "node:child_process";
import { resolve } from "node:path";
import "./clean-workspace-artifacts.mjs";

const root = resolve(import.meta.dirname, "..");
const stackName = process.argv[2] ?? "platform";

const services = {
  "billing-api": { color: "\x1b[33m", command: ["billing-api"], label: "billing api", logLabel: "billing-api" },
  "billing-web": { color: "\x1b[37m", command: ["billing-web"], label: "billing web", logLabel: "billing-web" },
  "core-api": { color: "\x1b[35m", command: ["core-api"], label: "core api", logLabel: "core-api" },
  "core-web": { color: "\x1b[34m", command: ["core-web"], label: "core web", logLabel: "core-web" },
  "platform-api": { color: "\x1b[36m", command: ["platform-api"], label: "api", logLabel: "api" },
  "platform-web": { color: "\x1b[32m", command: ["platform-web"], label: "web", logLabel: "web" }
};

const stacks = {
  all: ["platform-api", "platform-web", "billing-api", "billing-web"],
  billing: ["platform-api", "billing-api", "billing-web"],
  core: ["platform-api", "platform-web"],
  platform: ["platform-api", "platform-web"]
};

if (!stacks[stackName]) {
  console.error(`Unknown dev stack "${stackName}". Use one of: ${Object.keys(stacks).join(", ")}`);
  process.exit(1);
}

const reset = "\x1b[0m";
const children = new Set();

console.log(`\nCODEXSUN dev stack: ${stackName}`);
for (const serviceName of stacks[stackName]) {
  const service = services[serviceName];
  console.log(`  - ${service.label}`);
}
console.log("");

for (const serviceName of stacks[stackName]) {
  startService(serviceName);
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => {
    stopChildren();
    process.exit(0);
  });
}

function startService(serviceName) {
  const service = services[serviceName];
  const child = spawn(process.execPath, ["tools/preflight.mjs", ...service.command], {
    cwd: root,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"]
  });

  children.add(child);
  child.stdout.on("data", (chunk) => writeServiceLines(serviceName, service, chunk));
  child.stderr.on("data", (chunk) => writeServiceLines(serviceName, service, chunk));
  child.on("exit", (code) => {
    children.delete(child);
    if (code && code !== 0) {
      console.error(`${service.color}[${service.logLabel}]${reset} exited with code ${code}`);
      stopChildren(child);
      process.exit(code);
    }
  });
}

function writeServiceLines(serviceName, service, chunk) {
  for (const rawLine of String(chunk).split(/\r?\n/u)) {
    const line = cleanLine(rawLine);
    if (!line || shouldHideLine(line)) {
      continue;
    }
    process.stdout.write(`${service.color}[${service.logLabel}]${reset} ${line}\n`);
  }
}

function cleanLine(line) {
  return line
    .replace(/\u001b\[[0-9;]*m/gu, "")
    .replace(/^âžœ\s*/u, "")
    .replace(/^➜\s*/u, "")
    .replace(/[ \t]+/gu, " ")
    .trim();
}

function shouldHideLine(line) {
  return (
    line.includes("[vite] (client) [optimizer]") ||
    line.includes("Re-optimizing dependencies") ||
    line === "VITE" ||
    line === "ready"
  );
}

function stopChildren(skipChild) {
  for (const child of children) {
    if (child === skipChild || child.killed || !child.pid) {
      continue;
    }

    if (process.platform === "win32") {
      spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
        stdio: "ignore"
      });
    } else {
      child.kill("SIGTERM");
    }
  }
}
