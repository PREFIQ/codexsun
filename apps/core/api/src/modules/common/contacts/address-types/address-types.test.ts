import { describe, expect, it } from "vitest";
import { ADDRESS_TYPES_COLLECTION_PATH } from "./address-types.routes.js";

describe("Address Types module contract", () => {
  it("owns its route", () =>
    expect(ADDRESS_TYPES_COLLECTION_PATH).toBe("/core/common/contacts/address-types"));
});
