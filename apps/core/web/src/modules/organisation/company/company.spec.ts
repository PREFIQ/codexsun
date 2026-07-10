import { describe, expect, it } from "vitest";
import { companyDefinition } from "./company.definition";
describe("Company master page", () => { it("has a route", () => { expect(companyDefinition.route).toBeTruthy(); }); });
