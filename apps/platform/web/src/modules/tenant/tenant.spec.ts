export {};
import { describe, expect, it } from "vitest";
import { validateTenantPayload } from "./tenant.schema";
import type { TenantSavePayload } from "./tenant.types";

describe("tenant form schema", () => {
  it("rejects missing tenant identity", () => {
    expect(validateTenantPayload({ tenantCode: "", tenantName: "" } as TenantSavePayload)).toBe("Tenant name is required.");
  });
});
