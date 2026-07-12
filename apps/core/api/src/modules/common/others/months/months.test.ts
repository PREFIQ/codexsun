import { describe, expect, it } from "vitest";
import { MONTHS_COLLECTION_PATH } from "./months.routes.js";

describe("Months module contract", () => {
  it("owns its route", () => expect(MONTHS_COLLECTION_PATH).toBe("/core/common/others/months"));
});
