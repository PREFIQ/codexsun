import { describe, expect, it } from "vitest";
import { quotationSchema } from "./quotation.schema";

describe("quotation validation", () => {
  it("requires customer and at least one item", () => {
    expect(quotationSchema.safeParse({ customerName: "", date: "", items: [], quotationNumber: "", status: "draft", taxType: "cgst-sgst" }).success).toBe(false);
  });
});
