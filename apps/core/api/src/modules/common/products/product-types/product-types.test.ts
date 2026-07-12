import { describe, expect, it } from "vitest";
import { PRODUCT_TYPES_COLLECTION_PATH } from "./product-types.routes.js";

describe("Product Types module contract", () => {
  it("owns its route", () =>
    expect(PRODUCT_TYPES_COLLECTION_PATH).toBe("/core/common/products/product-types"));
});
