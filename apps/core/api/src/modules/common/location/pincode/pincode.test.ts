import { describe, expect, it } from "vitest";
import { PINCODE_COLLECTION_PATH, PINCODE_RELATIONS_PATH } from "./pincode.routes.js";

describe("pincode location module contract", () => {
  it("uses the common location route and independent pincode table", () => {
    expect(PINCODE_COLLECTION_PATH).toBe("/core/common/location/pincodes");
    expect(PINCODE_RELATIONS_PATH).toBe("/core/common/location/pincodes/relations");
  });
});
