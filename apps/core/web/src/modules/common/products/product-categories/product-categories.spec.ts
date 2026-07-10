import { describe, expect, it } from "vitest";
import { productCategoriesDefinition } from "./product-categories.definition";
describe("Product Categories", () => { it("keeps an independent frontend route", () => expect(productCategoriesDefinition.route).toContain("products")); });
