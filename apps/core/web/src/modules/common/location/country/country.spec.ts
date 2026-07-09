import { describe, expect, it } from "vitest";
import { countryDefinition } from "../shared/location.definitions";

describe("country frontend module", () => {
  it("uses the common location country route", () => {
    expect(countryDefinition.path).toBe("/core/common/location/countries");
  });
});

