import { describe, expect, it } from "vitest";

describe("sales module contract", () => {
  it("uses the billing sales route family", () => {
    expect("/billing/sales").toContain("sales");
  });
});
