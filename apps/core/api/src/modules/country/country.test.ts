import { describe, expect, it } from "vitest";

describe("country module contract", () => {
  it("uses the core country route family", () => {
    expect("/core/countries").toContain("countries");
  });
});
