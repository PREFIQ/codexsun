import { describe, expect, it } from "vitest";
import { normalizePlanAccessKeys, planAccessSchema } from "./plan-access.schema";

describe("plan access", () => {
  it("keeps platform application in selected modules", () => {
    expect(normalizePlanAccessKeys(["billing.sales"])).toEqual(["billing.sales", "platform.application"]);
  });

  it("requires at least one module", () => {
    expect(planAccessSchema.safeParse({ moduleKeys: [] }).success).toBe(false);
  });
});
