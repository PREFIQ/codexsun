import { describe, expect, it } from "vitest";
import { masterDefinitions } from "./master.definitions";

describe("master web module", () => {
  it("owns master definitions", () => {
    expect(masterDefinitions.company.kind).toBe("company");
  });
});
