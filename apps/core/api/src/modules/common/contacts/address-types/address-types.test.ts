import { describe, expect, it } from "vitest";
import { addressTypesDefinition } from "./address-types.definition.js";
describe("Address Types", () => { it("owns an independent table and required fields", () => { expect(addressTypesDefinition.tableName).toBe("core_common_address_types"); expect(addressTypesDefinition.fields.filter((field) => field.required).length).toBeGreaterThan(0); }); });
