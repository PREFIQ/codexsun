import { describe, expect, it } from "vitest";
import { entitlementNeedsSync } from "./entitlement.sync.js";
import { normalizePlanAccessKeys } from "./entitlement.service.js";

describe("entitlement module", () => {
  it("detects newer server entitlements", () => {
    expect(entitlementNeedsSync(1, 2)).toBe(true);
  });

  it("keeps platform application enabled for plan access", () => {
    expect(normalizePlanAccessKeys(["billing.sales", "billing.sales"])).toEqual(["billing.sales", "platform.application"]);
  });
});
