import { z } from "zod";
import { ServiceOrdersRepository } from "./service-orders.repository.js";
import type { ServiceOrderInput, ServiceOrderStatus } from "./service-orders.types.js";
const inputSchema = z.object({
  guestName: z.string().trim().max(160).optional(),
  items: z
    .array(
      z.object({
        itemName: z.string().trim().min(1),
        kitchenStation: z.string().trim().min(1),
        notes: z.string().trim().max(500).optional(),
        quantity: z.number().positive(),
        unitPrice: z.number().nonnegative()
      })
    )
    .min(1),
  notes: z.string().trim().max(2000).optional(),
  tableLabel: z.string().trim().min(1),
  waiterName: z.string().trim().min(1)
});
const transitions: Record<ServiceOrderStatus, ServiceOrderStatus[]> = {
  draft: ["submitted", "cancelled"],
  submitted: ["accepted", "cancelled"],
  accepted: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["served"],
  served: ["bill-waiting"],
  "bill-waiting": ["closed"],
  closed: [],
  cancelled: []
};
export class ServiceOrdersService {
  constructor(private readonly repository = new ServiceOrdersRepository()) {}
  list(db: string, tenant: string, status?: ServiceOrderStatus) {
    return this.repository.list(db, tenant, status);
  }
  create(db: string, tenant: string, input: ServiceOrderInput) {
    return this.repository.create(db, tenant, inputSchema.parse(input));
  }
  async transition(db: string, tenant: string, id: string, next: ServiceOrderStatus) {
    const current = await this.repository.find(db, tenant, id);
    if (!current) return null;
    if (!transitions[current.status].includes(next))
      throw new Error(`Invalid order transition: ${current.status} -> ${next}`);
    return this.repository.transition(db, tenant, id, next);
  }
  allowedTransitions(status: ServiceOrderStatus) {
    return transitions[status];
  }
}
