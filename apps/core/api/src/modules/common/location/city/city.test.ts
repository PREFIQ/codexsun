import { describe, expect, it } from "vitest";
import { cityLocationDefinition } from "../location.definitions.js";

describe("city location module contract", () => {
  it("uses the common location route and city table", () => {
    expect(cityLocationDefinition.collectionPath).toBe("/core/common/location/cities");
    expect(cityLocationDefinition.tableName).toBe("core_cities");
  });
});

