import { describe, expect, it } from "vitest";
import { normalizeKey } from "./access-control.service.js";
import { accessControlNeedsSync } from "./access-control.sync.js";

describe("access control", () => {
  it("normalizes access keys", () => expect(normalizeKey(" Platform Access Manage ")).toBe("platform.access.manage"));
  it("detects sync changes", () => expect(accessControlNeedsSync(1, 2)).toBe(true));
});
