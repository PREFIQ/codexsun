import { describe, expect, it } from "vitest";
import { entryFilterSchema, entryQuickFormSchema } from "./entries.schema";

describe("entries validation", () => {
  it("accepts supported entry kinds", () => {
    expect(entryFilterSchema.safeParse({ kind: "sales", search: "" }).success).toBe(true);
  });

  it("requires document and customer fields", () => {
    expect(entryQuickFormSchema.safeParse({ customerName: "", documentDate: "", documentNo: "" }).success).toBe(false);
  });
});
