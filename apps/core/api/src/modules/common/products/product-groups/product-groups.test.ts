import { describe, expect, it } from "vitest";
import { PRODUCT_GROUPS_COLLECTION_PATH } from "./product-groups.routes.js";

describe("Product Groups module contract", () => {
  it("owns its route", () =>
    expect(PRODUCT_GROUPS_COLLECTION_PATH).toBe("/core/common/products/product-groups"));
});
