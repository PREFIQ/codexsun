import { describe, expect, it } from "vitest";
import { productDefinition } from "./product.definition";
import { nextProductCode, productTabs } from "./product.form";
import type { MasterRecord } from "../master.types";

describe("Product master page", () => {
  it("has a route", () => {
    expect(productDefinition.route).toBeTruthy();
  });

  it("keeps product input sections isolated", () => {
    expect(productTabs).toEqual(["details", "stock", "settings"]);
  });

  it("generates the next editable product code", () => {
    const records = [{ code: "P-0003" }, { code: "CUSTOM" }] as MasterRecord[];
    expect(nextProductCode(records)).toBe("P-0004");
  });
});
