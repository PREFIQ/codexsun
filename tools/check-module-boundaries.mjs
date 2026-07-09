import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const moduleRoots = [
  {
    app: "accounts-api",
    path: join(process.cwd(), "apps", "accounts", "api", "src", "modules")
  },
  {
    app: "billing-api",
    path: join(process.cwd(), "apps", "billing", "api", "src", "modules")
  },
  {
    app: "core-api",
    path: join(process.cwd(), "apps", "core", "api", "src", "modules")
  },
  {
    app: "platform-api",
    path: join(process.cwd(), "apps", "platform", "api", "src", "modules")
  }
];

const requiredBackendRoles = [
  "module",
  "service",
  "repository",
  "routes",
  "events",
  "migration",
  "worker",
  "seed",
  "sync",
  "types"
];

const webModuleRoots = [
  {
    app: "accounts-web",
    path: join(process.cwd(), "apps", "accounts", "web", "src", "modules")
  },
  {
    app: "billing-web",
    path: join(process.cwd(), "apps", "billing", "web", "src", "modules")
  },
  {
    app: "core-web",
    path: join(process.cwd(), "apps", "core", "web", "src", "modules")
  },
  {
    app: "platform-web",
    path: join(process.cwd(), "apps", "platform", "web", "src", "modules")
  }
];

const requiredFrontendRoles = ["workspace", "list", "form", "services", "hooks", "types", "schema", "spec"];
const backendBehaviorMarkers = {
  events: ["create"],
  migration: ["migrate"],
  module: ["register"],
  seed: ["seed"],
  sync: ["function"],
  worker: ["process"]
};
const forbiddenScaffoldPatterns = [
  /reserved\s+(worker|sync|seed|migration)\s+surface/i,
  /queues\s*:\s*\[\s*\]/,
  /export\s*\{\s*\w+\s+as\s+\w+\s*\}\s*from/
];

const missing = [];

for (const root of moduleRoots) {
  if (!existsSync(root.path)) {
    missing.push(`${root.app}: missing src/modules`);
    continue;
  }

  const modules = readdirSync(root.path, { withFileTypes: true }).filter((entry) => entry.isDirectory());
  for (const moduleDir of modules) {
    const modulePath = join(root.path, moduleDir.name);
    for (const role of requiredBackendRoles) {
      const filePath = join(modulePath, `${moduleDir.name}.${role}.ts`);
      if (!existsSync(filePath)) {
        missing.push(`${root.app}/${moduleDir.name}: missing ${moduleDir.name}.${role}.ts`);
        continue;
      }
      validateRoleFile(filePath, `${root.app}/${moduleDir.name}`, role);
    }
    if (!existsSync(join(modulePath, "index.ts"))) {
      missing.push(`${root.app}/${moduleDir.name}: missing index.ts`);
    }
  }
}

for (const root of webModuleRoots) {
  if (!existsSync(root.path)) continue;
  const modules = readdirSync(root.path, { withFileTypes: true }).filter((entry) => entry.isDirectory());
  for (const moduleDir of modules) {
    const modulePath = join(root.path, moduleDir.name);
    if (!existsSync(join(modulePath, `${moduleDir.name}.services.ts`))) continue;

    for (const role of requiredFrontendRoles) {
      const extension = ["form", "list", "workspace"].includes(role) ? "tsx" : "ts";
      const filePath = join(modulePath, `${moduleDir.name}.${role}.${extension}`);
      if (!existsSync(filePath)) {
        missing.push(`${root.app}/${moduleDir.name}: missing ${moduleDir.name}.${role}.${extension}`);
        continue;
      }
      validateRoleFile(filePath, `${root.app}/${moduleDir.name}`, role);
    }
    if (!existsSync(join(modulePath, "index.ts"))) {
      missing.push(`${root.app}/${moduleDir.name}: missing index.ts`);
    }
  }
}

if (missing.length > 0) {
  console.error("Module boundary check failed:");
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log("Module boundary check passed.");

function validateRoleFile(filePath, moduleLabel, role) {
  const source = readFileSync(filePath, "utf8").trim();
  if (!source) {
    missing.push(`${moduleLabel}: ${role} role is empty`);
    return;
  }
  for (const pattern of forbiddenScaffoldPatterns) {
    if (pattern.test(source)) {
      missing.push(`${moduleLabel}: ${role} role is scaffold-only or alias-only`);
      return;
    }
  }
  const markers = backendBehaviorMarkers[role];
  if (markers && !markers.some((marker) => source.toLowerCase().includes(marker))) {
    missing.push(`${moduleLabel}: ${role} role has no callable ${markers.join("/")} behavior`);
  }
  if (["form", "list", "workspace"].includes(role) && !/export\s+function\s+\w+/.test(source)) {
    missing.push(`${moduleLabel}: ${role} role must export a real component`);
  }
  if (role === "spec" && !/\b(describe|test|it)\s*\(/.test(source)) {
    missing.push(`${moduleLabel}: spec role has no executable test`);
  }
}
