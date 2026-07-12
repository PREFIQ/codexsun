import { describe, expect, it } from "vitest";
import { TAXES_COLLECTION_PATH } from "./taxes.routes.js";

describe("Taxes module contract", () => {
  it("owns its route", () => expect(TAXES_COLLECTION_PATH).toBe("/core/common/products/taxes"));
});
