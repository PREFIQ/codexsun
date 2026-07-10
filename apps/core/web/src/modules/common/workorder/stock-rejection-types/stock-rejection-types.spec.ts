import { describe, expect, it } from "vitest";
import { stockRejectionTypesDefinition } from "./stock-rejection-types.definition";
describe("Stock Rejection Types", () => { it("keeps an independent frontend route", () => expect(stockRejectionTypesDefinition.route).toContain("workorder")); });
