import { describe, expect, it } from "vitest";
import { salesTypesDefinition } from "./sales-types.definition";
describe("Sales Types", () => { it("keeps an independent frontend route", () => expect(salesTypesDefinition.route).toContain("others")); });
