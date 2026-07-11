export type KitchenServePage =
  | "overview"
  | "tables"
  | "menu"
  | "waiter-orders"
  | "kitchen"
  | "ready"
  | "bill-waiting"
  | "history"
  | "settings";
export type ServiceOrderStatus =
  | "draft"
  | "submitted"
  | "accepted"
  | "preparing"
  | "ready"
  | "served"
  | "bill-waiting"
  | "closed"
  | "cancelled";
export interface ServiceOrderItemInput {
  itemName: string;
  kitchenStation: string;
  notes?: string;
  quantity: number;
  unitPrice: number;
}
export interface ServiceOrderInput {
  guestName?: string;
  items: ServiceOrderItemInput[];
  notes?: string;
  tableLabel: string;
  waiterName: string;
}
export interface ServiceOrder {
  createdAt: string;
  guestName: string | null;
  id: number;
  items: Array<ServiceOrderItemInput & { id: number; status: string }>;
  notes: string | null;
  status: ServiceOrderStatus;
  tableLabel: string;
  tenantId: string;
  uuid: string;
  waiterName: string;
}
