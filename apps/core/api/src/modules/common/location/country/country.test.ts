import { describe, expect, it } from "vitest";
import { COUNTRY_COLLECTION_PATH } from "./country.routes.js";

describe("country module contract", () => {
  it("owns the country route", () => {
    expect(COUNTRY_COLLECTION_PATH).toBe("/core/common/location/countries");
  });
});
