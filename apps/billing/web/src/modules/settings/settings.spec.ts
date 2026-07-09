import { describe, expect, it } from "vitest";
import { salesSettingsSchema } from "./settings.schema";
import { defaultBillingSettings } from "./settings.types";

describe("sales settings validation", () => {
  it("accepts the billing settings shape", () => {
    expect(salesSettingsSchema.safeParse(defaultBillingSettings).success).toBe(true);
  });
});
