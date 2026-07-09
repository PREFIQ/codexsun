import { describe, expect, it } from "vitest";
import { warehousesDefinition } from "./warehouses.definition";
describe("Warehouses", () => { it("keeps an independent frontend route", () => expect(warehousesDefinition.route).toContain("workorder")); });
