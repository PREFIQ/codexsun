import { describe, expect, it } from "vitest";
import { UNITS_COLLECTION_PATH } from "./units.routes.js";

describe("Units module contract", () => {
  it("owns its route", () => expect(UNITS_COLLECTION_PATH).toBe("/core/common/products/units"));
});
