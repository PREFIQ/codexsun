import { describe, expect, it } from "vitest";
import { pincodeLocationDefinition } from "../location.definitions.js";

describe("pincode location module contract", () => {
  it("uses the common location route and independent pincode table", () => {
    expect(pincodeLocationDefinition.collectionPath).toBe("/core/common/location/pincodes");
    expect(pincodeLocationDefinition.tableName).toBe("core_pincodes");
  });
});

