import { describe, expect, it } from "vitest";
import { PRODUCT_CATEGORIES_COLLECTION_PATH } from "./product-categories.routes.js";

describe("Product Categories module contract", () => {
  it("owns its route", () =>
    expect(PRODUCT_CATEGORIES_COLLECTION_PATH).toBe("/core/common/products/product-categories"));
});
