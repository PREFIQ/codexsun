import { describe, expect, it } from "vitest";
import { productGroupsDefinition } from "./product-groups.definition";
describe("Product Groups", () => { it("keeps an independent frontend route", () => expect(productGroupsDefinition.route).toContain("products")); });
