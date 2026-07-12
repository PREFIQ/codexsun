import { describe, expect, it } from "vitest";
import { SALES_TYPES_COLLECTION_PATH } from "./sales-types.routes.js";

describe("Sales Types module contract", () => {
  it("owns its route", () =>
    expect(SALES_TYPES_COLLECTION_PATH).toBe("/core/common/others/sales-types"));
});
