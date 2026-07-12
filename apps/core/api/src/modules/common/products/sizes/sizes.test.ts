import { describe, expect, it } from "vitest";
import { SIZES_COLLECTION_PATH } from "./sizes.routes.js";

describe("Sizes module contract", () => {
  it("owns its route", () => expect(SIZES_COLLECTION_PATH).toBe("/core/common/products/sizes"));
});
