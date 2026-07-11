import { Button, StatusBadge } from "@codexsun/ui";
import type { ServiceOrder, ServiceOrderStatus } from "./service-orders.types";
const next: Partial<Record<ServiceOrderStatus, { label: string; status: ServiceOrderStatus }>> = {
  draft: { label: "Send to kitchen", status: "submitted" },
  submitted: { label: "Accept", status: "accepted" },
  accepted: { label: "Start preparing", status: "preparing" },
  preparing: { label: "Mark ready", status: "ready" },
  ready: { label: "Mark served", status: "served" },
  served: { label: "Send to bill", status: "bill-waiting" },
  "bill-waiting": { label: "Close bill", status: "closed" }
};
export function ServiceOrdersList({
  busy,
  onTransition,
  records
}: {
  busy: boolean;
  onTransition: (id: string, status: ServiceOrderStatus) => void;
  records: ServiceOrder[];
}) {
  return (
    <section className="rounded-md border bg-card shadow-sm">
      <div className="border-b px-5 py-4">
        <h2 className="text-lg font-semibold">Live orders</h2>
      </div>
      <div className="divide-y">
        {records.map((order) => {
          const action = next[order.status];
          return (
            <div
              className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
              key={order.uuid}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{order.tableLabel}</span>
                  <StatusBadge
                    tone={
                      order.status === "ready"
                        ? "green"
                        : order.status === "cancelled"
                          ? "red"
                          : order.status === "bill-waiting"
                            ? "amber"
                            : "blue"
                    }
                  >
                    {order.status}
                  </StatusBadge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {order.waiterName} ·{" "}
                  {order.items.map((item) => `${item.quantity} × ${item.itemName}`).join(", ")}
                </p>
              </div>
              {action ? (
                <Button
                  disabled={busy}
                  size="sm"
                  onClick={() => onTransition(order.uuid, action.status)}
                >
                  {action.label}
                </Button>
              ) : null}
            </div>
          );
        })}
        {records.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            No orders in this queue.
          </div>
        ) : null}
      </div>
    </section>
  );
}
