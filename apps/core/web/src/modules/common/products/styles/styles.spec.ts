import { describe, expect, it } from "vitest";
import { stylesDefinition } from "./styles.definition";
describe("Styles", () => { it("keeps an independent frontend route", () => expect(stylesDefinition.route).toContain("products")); });
