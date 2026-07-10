import { describe, expect, it } from "vitest";
import { monthsDefinition } from "./months.definition";
describe("Months", () => { it("keeps an independent frontend route", () => expect(monthsDefinition.route).toContain("others")); });
