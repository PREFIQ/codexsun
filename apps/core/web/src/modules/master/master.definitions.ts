import type { MasterDefinition, MasterKind } from "./master.types";
import { companyDefinition } from "../organisation/company/company.definition";
import { workOrderDefinition } from "./work-order/work-order.definition";

export const masterDefinitions: Record<MasterKind, MasterDefinition> = {
  company: companyDefinition,
  contact: {
    description: "Standalone contact master with tax, communication, address, finance, and lookup-ready profile fields.",
    kind: "contact",
    label: "Contacts",
    route: "contacts",
    search: "Search code, contact, ledger, phone, email",
    singular: "contact"
  },
  product: {
    description: "Product master with group, category, HSN, tax, opening stock, opening rate, unit, and lookup-ready details.",
    kind: "product",
    label: "Products",
    route: "products",
    search: "Search code, product, HSN, unit",
    singular: "product"
  },
  "work-order": workOrderDefinition
};
