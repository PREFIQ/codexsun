import { describe, expect, it } from "vitest";
import { pincodeDefinition } from "../shared/location.definitions";

describe("pincode frontend module", () => {
  it("uses the common location pincode route", () => {
    expect(pincodeDefinition.path).toBe("/core/common/location/pincodes");
  });
});

