import { describe, expect, it } from "vitest";
import { TenantService } from "./tenant.service.js";

describe("TenantService", () => {
  it("starts with an empty tenant registry", () => {
    const service = new TenantService();
    expect(service.listTenants()).toEqual([]);
  });
});
