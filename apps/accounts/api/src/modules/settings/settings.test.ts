import { describe, expect, it } from "vitest";
import { defaultAccountsSettings } from "./settings.types.js";
import { shouldSyncAccountsSettings } from "./settings.sync.js";

describe("accounts settings", () => {
  it("keeps billing save posting enabled by default", () => {
    expect(shouldSyncAccountsSettings(defaultAccountsSettings)).toBe(true);
  });
});
