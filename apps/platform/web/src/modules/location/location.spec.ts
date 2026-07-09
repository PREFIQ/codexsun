import { describe, expect, it } from "vitest";
import { locationDefinitions } from "./location.definitions";
describe("platform location definitions", () => {
  it("keeps five independent location routes", () => expect(Object.keys(locationDefinitions)).toHaveLength(5));
});
