import { describe, expect, it } from "vitest";
import { PRIORITIES_COLLECTION_PATH } from "./priorities.routes.js";

describe("Priorities module contract", () => {
  it("owns its route", () =>
    expect(PRIORITIES_COLLECTION_PATH).toBe("/core/common/others/priorities"));
});
