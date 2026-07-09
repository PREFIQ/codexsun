import { describe, expect, it } from "vitest";
import { districtDefinition } from "../shared/location.definitions";

describe("district frontend module", () => {
  it("uses the common location district route", () => {
    expect(districtDefinition.path).toBe("/core/common/location/districts");
  });
});

