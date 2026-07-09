import { seedCommonMaster } from "../../foundation/common-master.seed.js";
import { productCategoriesDefinition } from "./product-categories.definition.js";
export function seedProductCategories() { return seedCommonMaster(productCategoriesDefinition); }
