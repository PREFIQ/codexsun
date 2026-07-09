import { describe, expect, it } from "vitest";
import { stateLocationDefinition } from "../location.definitions.js";

describe("state location module contract", () => {
  it("uses the common location route and state table", () => {
    expect(stateLocationDefinition.collectionPath).toBe("/core/common/location/states");
    expect(stateLocationDefinition.tableName).toBe("core_states");
  });
});

