import { describe, expect, it } from "vitest";
import { normalizeStorageRelativePath, sanitizeStorageSegment, storageShortTimestamp } from "./storage-manager.paths.js";

describe("storage manager paths", () => {
  it("keeps relative paths inside a clean browser shape", () => {
    expect(normalizeStorageRelativePath("logo/../images\\team.png")).toBe("logo/images/team.png");
  });

  it("creates readable timestamp names without filesystem-hostile characters", () => {
    expect(storageShortTimestamp(new Date("2026-07-09T19:03:16.622Z"))).toBe("20260709-190316");
  });

  it("sanitizes tenant folders", () => {
    expect(sanitizeStorageSegment("Tenant ACME / Main")).toBe("tenant-acme-main");
  });
});
