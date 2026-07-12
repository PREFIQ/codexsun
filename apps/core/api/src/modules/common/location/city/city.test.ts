import { describe, expect, it } from "vitest";
import { CITY_COLLECTION_PATH } from "./city.routes.js";

describe("city module contract", () => {
  it("owns the city route", () => {
    expect(CITY_COLLECTION_PATH).toBe("/core/common/location/cities");
  });
});
