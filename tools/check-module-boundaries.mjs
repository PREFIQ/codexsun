import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const moduleRoots = [
  {
    app: "platform-api",
    path: join(process.cwd(), "apps", "platform", "api", "src", "modules")
  }
];

const requiredRoles = [
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

const missing = [];

for (const root of moduleRoots) {
  if (!existsSync(root.path)) {
    missing.push(`${root.app}: missing src/modules`);
    continue;
  }

  const modules = readdirSync(root.path, { withFileTypes: true }).filter((entry) => entry.isDirectory());
  for (const moduleDir of modules) {
    const modulePath = join(root.path, moduleDir.name);
    for (const role of requiredRoles) {
      const filePath = join(modulePath, `${moduleDir.name}.${role}.ts`);
      if (!existsSync(filePath)) {
        missing.push(`${root.app}/${moduleDir.name}: missing ${moduleDir.name}.${role}.ts`);
      }
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
