import { describe, expect, it } from "vitest";
import { entitlementSchema } from "./entitlement.schema";

describe("entitlement schema", () => {
  it("requires a plan for plan entitlements", () => {
    expect(
      entitlementSchema.safeParse({
        appId: 1,
        endsOn: null,
        moduleKey: "platform.tenant",
        planId: 1,
        scope: "plan",
        source: "manual",
        startsOn: "2026-07-08",
        status: "active",
        tenantId: null
      }).success
    ).toBe(true);
  });
});
