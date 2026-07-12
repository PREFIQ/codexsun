import { describe, expect, it } from "vitest";
import { currenciesDefinition } from "./currencies.definition.js";
describe("Currencies", () => { it("owns an independent table and required fields", () => { expect(currenciesDefinition.tableName).toBe("currencies"); expect(currenciesDefinition.fields.filter((field) => field.required).length).toBeGreaterThan(0); }); });
