export type WorkOrderRecord = {
  id: number;
  uuid: string;
  code: string;
  name: string;
  status: "active" | "inactive" | "suspend" | "deleted";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};
export type WorkOrderSavePayload = Partial<
  Pick<WorkOrderRecord, "code" | "name" | "status" | "isActive">
>;
export type WorkOrderLookupRecord = {
  id: number;
  code?: string | null;
  name?: string | null;
  description?: string | null;
};
export const workOrderDefinition = {
  description: "Work order master with owned code, name, status, and lifecycle.",
  label: "Work Orders",
  route: "work-orders",
  search: "Search code or work order",
  singular: "work order"
} as const;
