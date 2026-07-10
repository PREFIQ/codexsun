import { describe, expect, it } from "vitest";
import { companyDefinition } from "../../organisation/company/company.definition.js";

describe("Company organisation wrapper", () => {
  it("points at the organisation-owned company table", () => {
    expect(companyDefinition.tableName).toBe("core_master_companies");
  });
});
