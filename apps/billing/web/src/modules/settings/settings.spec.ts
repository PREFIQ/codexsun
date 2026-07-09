import { describe, expect, it } from "vitest";
import { salesSettingsSchema } from "./settings.schema";

describe("sales settings validation", () => {
  it("accepts the billing settings shape", () => {
    expect(salesSettingsSchema.safeParse({ featureQuotation: true, gstApiMode: "einvoice_eway", useColour: true, useDc: false, useEinvoice: true, useEway: true, usePo: false, useSize: true }).success).toBe(true);
  });
});
