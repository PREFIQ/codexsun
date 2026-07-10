import { describe, expect, it } from "vitest";
import { companyDefinition } from "../../organisation/company/company.definition";

describe("Company organisation wrapper", () => {
  it("uses the organisation API path", () => {
    expect(companyDefinition.apiPath).toBe("/core/organisation/companies");
  });
});
