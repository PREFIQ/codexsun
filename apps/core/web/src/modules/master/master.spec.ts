import { describe, expect, it } from "vitest";
import { masterDefinitions } from "./master.definitions";
import { defaultTabsForMaster } from "./master.workspace";

describe("master web module", () => {
  it("owns master definitions", () => {
    expect(masterDefinitions.company.kind).toBe("company");
  });

  it("keeps contact profile tabs separate from product stock tabs", () => {
    expect(defaultTabsForMaster(masterDefinitions.contact)).toEqual([
      "details",
      "tax",
      "communication",
      "addresses",
      "finance",
      "more",
      "settings"
    ]);
    expect(defaultTabsForMaster(masterDefinitions.contact)).not.toContain("stock");
  });

  it("keeps product stock tabs on product only", () => {
    expect(defaultTabsForMaster(masterDefinitions.product)).toEqual(["details", "stock", "settings"]);
  });
});
