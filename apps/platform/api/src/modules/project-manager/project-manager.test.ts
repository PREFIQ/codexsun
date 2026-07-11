import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";

let tempDir = "";

describe("project manager json store", () => {
  afterEach(async () => {
    if (tempDir) await rm(tempDir, { force: true, recursive: true });
    tempDir = "";
    delete process.env.PROJECT_MANAGER_JSON_DIR;
  });

  it("writes project records to JSON", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "codexsun-project-manager-"));
    process.env.PROJECT_MANAGER_JSON_DIR = tempDir;
    const { ProjectManagerJsonStore } = await import("./project-manager.store.js");
    const store = new ProjectManagerJsonStore();
    const record = await store.create("task", { key: "task.test", title: "Test task" });
    expect(record.id).toContain("task-");
    const file = await readFile(join(tempDir, "task-registry.json"), "utf8");
    expect(file).toContain("task.test");
  });

  it("builds platform registry drill-down data", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "codexsun-project-manager-"));
    process.env.PROJECT_MANAGER_JSON_DIR = tempDir;
    const { ProjectManagerJsonStore } = await import("./project-manager.store.js");
    const store = new ProjectManagerJsonStore();
    const result = await store.registryResult();
    expect(result.platforms.map((platform) => platform.name)).toEqual(["SUPER ADMIN", "ADMIN", "TENANT"]);
    const tenant = result.platforms.find((platform) => platform.id === "platform-tenant");
    const apps = tenant?.groups.find((group) => group.id === "group-tenant-apps");
    const application = apps?.modules.find((module) => module.id === "module-app-application");
    const billing = apps?.modules.find((module) => module.id === "module-app-billing");
    const entries = billing?.children.find((module) => module.id === "module-billing-entries");
    expect(apps?.modules.map((module) => module.id)).toEqual(["module-app-application", "module-app-billing", "module-app-accounts", "module-app-task-manager"]);
    expect(application?.children.map((module) => module.id)).toEqual(["module-application-platform", "module-application-organisation"]);
    expect(entries?.children.map((module) => module.id)).toContain("module-entry-quotation");
    expect(entries?.children.find((module) => module.id === "module-entry-quotation")?.documentation.routes.length).toBeGreaterThan(0);
  });
});
