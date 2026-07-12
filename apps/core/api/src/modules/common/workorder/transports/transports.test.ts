import { describe, expect, it } from "vitest";
import { transportsDefinition } from "./transports.definition.js";
describe("Transports", () => { it("owns an independent table and required fields", () => { expect(transportsDefinition.tableName).toBe("transports"); expect(transportsDefinition.fields.filter((field) => field.required).length).toBeGreaterThan(0); }); });
