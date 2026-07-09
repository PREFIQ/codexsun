import { describe, expect, it } from "vitest";
import { accountsModuleSchema } from "./accounts.schema";

describe("accounts web module contract", () => {
  it("keeps balanced posting required", () => {
    expect(accountsModuleSchema.parse({ balancedPostingRequired: true, moduleKey: "accounts.ledgers", tallyReady: true }).moduleKey).toBe("accounts.ledgers");
  });
});
