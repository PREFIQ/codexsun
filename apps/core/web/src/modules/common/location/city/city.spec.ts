import { describe, expect, it } from "vitest";
import { cityDefinition } from "../shared/location.definitions";

describe("city frontend module", () => {
  it("uses the common location city route", () => {
    expect(cityDefinition.path).toBe("/core/common/location/cities");
  });
});

