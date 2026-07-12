import { describe, expect, it } from "vitest";
import { HSN_CODES_COLLECTION_PATH } from "./hsn-codes.routes.js";

describe("HSN Codes module contract", () => {
  it("owns its route", () =>
    expect(HSN_CODES_COLLECTION_PATH).toBe("/core/common/products/hsn-codes"));
});
