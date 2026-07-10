import type { MasterDefinition } from "./foundation/master.types.js";
export const masterDefinitions = [
  { key: "contact", label: "Contacts", route: "contacts", tableName: "core_master_contacts", title: "Contact" },
  { key: "product", label: "Products", route: "products", tableName: "core_master_products", title: "Product" },
  { key: "work-order", label: "Work Orders", route: "work-orders", tableName: "core_master_work_orders", title: "Work Order" }
] as const satisfies MasterDefinition[];
export type CoreMasterDefinition = (typeof masterDefinitions)[number];
