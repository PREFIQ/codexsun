import { describe, expect, it } from "vitest";
import { CONTACT_GROUPS_COLLECTION_PATH } from "./contact-groups.routes.js";

describe("Contact Groups module contract", () => {
  it("owns its route", () =>
    expect(CONTACT_GROUPS_COLLECTION_PATH).toBe("/core/common/contacts/contact-groups"));
});
