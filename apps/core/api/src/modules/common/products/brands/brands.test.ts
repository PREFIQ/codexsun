import { describe, expect, it } from "vitest";
import { BRANDS_COLLECTION_PATH } from "./brands.routes.js";

describe("Brands module contract", () => {
  it("owns its route", () => expect(BRANDS_COLLECTION_PATH).toBe("/core/common/products/brands"));
});
