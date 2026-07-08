import { describe, expect, it } from "vitest";
import { salesSchema } from "./sales.schema";

describe("sales schema", () => {
  it("rejects negative totals", () => {
    expect(salesSchema.safeParse({ amount: -1 }).success).toBe(false);
  });
});
