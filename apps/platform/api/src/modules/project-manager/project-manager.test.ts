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
    expect(result.platforms.map((platform) => platform.name)).toEqual(expect.arrayContaining(["Super Admins", "Admin", "Tenant"]));
    const tenant = result.platforms.find((platform) => platform.id === "platform-tenant");
    const common = tenant?.groups.find((group) => group.id === "group-tenant-common");
    const master = tenant?.groups.find((group) => group.id === "group-tenant-master");
    const location = common?.modules.find((module) => module.id === "module-location");
    const contacts = master?.modules.find((module) => module.id === "module-contacts");
    expect(location?.children.map((module) => module.id)).toEqual(expect.arrayContaining(["module-countries", "module-states"]));
    expect(contacts?.children.map((module) => module.id)).toEqual(expect.arrayContaining(["module-contact-emails", "module-contact-phones"]));
  });
});
