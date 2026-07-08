import { describe, expect, it } from "vitest";
import { moduleCount, tenantAccessSummarySchema } from "./tenant-access.schema";

describe("tenant access", () => {
  it("counts unique modules", () => {
    expect(moduleCount(["platform.application", "platform.application"])).toBe(1);
  });

  it("validates summary shape", () => {
    expect(tenantAccessSummarySchema.safeParse({ enabledModuleKeys: [], tenantId: 1, tenantName: "CODEXSUN" }).success).toBe(true);
  });
});
