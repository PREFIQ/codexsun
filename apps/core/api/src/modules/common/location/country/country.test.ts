import { describe, expect, it } from "vitest";
import { countryLocationDefinition } from "../location.definitions.js";

describe("country location module contract", () => {
  it("uses the common location route and country table", () => {
    expect(countryLocationDefinition.collectionPath).toBe("/core/common/location/countries");
    expect(countryLocationDefinition.tableName).toBe("countries");
  });
});

