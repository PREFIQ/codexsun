import { describe, expect, it } from "vitest";
import { accessUserSchema, normalizeAccessKey } from "./access-control.schema";

describe("access control", () => {
  it("normalizes keys", () => expect(normalizeAccessKey("Platform Access Manage")).toBe("platform.access.manage"));
  it("validates users", () => expect(accessUserSchema.safeParse({ email: "bad", name: "", roleKey: "", status: "active" }).success).toBe(false));
});
