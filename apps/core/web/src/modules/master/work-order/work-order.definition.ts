import type { MasterDefinition } from "../master.types";

export const workOrderDefinition: MasterDefinition = {
  description: "Work order master with contact, destination, transport, warehouse, and status fields.",
  kind: "work-order",
  label: "Work Orders",
  route: "work-orders",
  search: "Search code, work order, contact",
  singular: "work order"
};
