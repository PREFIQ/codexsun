import { describe, expect, it } from "vitest";
import { districtLocationDefinition } from "../location.definitions.js";

describe("district location module contract", () => {
  it("uses the common location route and district table", () => {
    expect(districtLocationDefinition.collectionPath).toBe("/core/common/location/districts");
    expect(districtLocationDefinition.tableName).toBe("districts");
  });
});

