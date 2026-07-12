import { describe, expect, it } from "vitest";
import { CONTACT_TYPES_COLLECTION_PATH } from "./contact-types.routes.js";

describe("Contact Types module contract", () => {
  it("owns its route", () =>
    expect(CONTACT_TYPES_COLLECTION_PATH).toBe("/core/common/contacts/contact-types"));
});
