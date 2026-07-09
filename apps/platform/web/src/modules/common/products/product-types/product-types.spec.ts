import { describe, expect, it } from "vitest";
import { productTypesDefinition } from "./product-types.definition";
describe("Product Types", () => { it("keeps an independent frontend route", () => expect(productTypesDefinition.route).toContain("products")); });
