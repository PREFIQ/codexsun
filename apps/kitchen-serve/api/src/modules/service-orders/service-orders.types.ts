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
export type KitchenTicketStatus =
  "queued" | "accepted" | "preparing" | "ready" | "collected" | "cancelled";
export interface ServiceOrderItemInput {
  itemName: string;
  kitchenStation: string;
  notes?: string | undefined;
  quantity: number;
  unitPrice: number;
}
export interface ServiceOrderInput {
  guestName?: string | undefined;
  items: ServiceOrderItemInput[];
  notes?: string | undefined;
  tableLabel: string;
  waiterName: string;
}
export interface ServiceOrder {
  createdAt: string;
  guestName: string | null;
  id: number;
  items: Array<ServiceOrderItemInput & { id: number; status: KitchenTicketStatus }>;
  notes: string | null;
  status: ServiceOrderStatus;
  tableLabel: string;
  tenantId: string;
  uuid: string;
  waiterName: string;
}
