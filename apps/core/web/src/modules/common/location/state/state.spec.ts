import { describe, expect, it } from "vitest";
import { stateDefinition } from "../shared/location.definitions";

describe("state frontend module", () => {
  it("uses the common location state route", () => {
    expect(stateDefinition.path).toBe("/core/common/location/states");
  });
});

