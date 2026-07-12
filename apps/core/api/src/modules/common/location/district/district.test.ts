import { describe, expect, it } from "vitest";
import { DISTRICT_COLLECTION_PATH } from "./district.routes.js";

describe("district module contract", () => {
  it("owns the district route", () => {
    expect(DISTRICT_COLLECTION_PATH).toBe("/core/common/location/districts");
  });
});
