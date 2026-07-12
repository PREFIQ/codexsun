import { describe, expect, it } from "vitest";
import { BANK_NAMES_COLLECTION_PATH } from "./bank-names.routes.js";

describe("Bank Names module contract", () => {
  it("owns its route", () =>
    expect(BANK_NAMES_COLLECTION_PATH).toBe("/core/common/contacts/bank-names"));
});
