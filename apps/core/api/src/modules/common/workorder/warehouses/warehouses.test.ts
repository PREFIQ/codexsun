import { describe, expect, it } from "vitest";
import { WAREHOUSES_COLLECTION_PATH } from "./warehouses.routes.js";

describe("Warehouses module contract", () => {
  it("owns its route", () =>
    expect(WAREHOUSES_COLLECTION_PATH).toBe("/core/common/workorder/warehouses"));
});
