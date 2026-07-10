import { describe, expect, it } from "vitest";
import { defaultBillingSettings } from "./billing-settings.types";

describe("billing settings module", () => {
  it("owns document layout defaults", () => {
    expect(defaultBillingSettings.layout.usePo).toBeTypeOf("boolean");
  });
});
