import { describe, expect, it } from "vitest";
import { CURRENCIES_COLLECTION_PATH } from "./currencies.routes.js";

describe("Currencies module contract", () => {
  it("owns its route", () =>
    expect(CURRENCIES_COLLECTION_PATH).toBe("/core/common/others/currencies"));
});
