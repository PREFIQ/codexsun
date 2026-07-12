import { describe, expect, it } from "vitest";
import { companyDefinition } from "./company.definition.js";
describe("Company master", () => { it("owns its table", () => { expect(companyDefinition.tableName).toBe("companies"); }); });
