import { StatusBadge } from "@codexsun/ui";
import { ServiceOrdersForm } from "./service-orders.form";
import { useServiceOrderActions, useServiceOrders } from "./service-orders.hooks";
import { ServiceOrdersList } from "./service-orders.list";
import type { KitchenServePage, ServiceOrderStatus } from "./service-orders.types";
export function ServiceOrdersWorkspace({ page }: { page: KitchenServePage }) {
  const status = statusForPage(page);
  const query = useServiceOrders(status);
  const actions = useServiceOrderActions();
  const busy = actions.create.isPending || actions.transition.isPending;
  return (
    <main className="mx-auto w-[calc(100%-2rem)] max-w-[92rem] space-y-5 py-5 lg:w-[calc(100%-3rem)]">
      <section className="rounded-md border bg-card p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase text-muted-foreground">
              KitchenServe · Hotel POS
            </p>
            <h1 className="mt-2 text-3xl font-semibold">{title(page)}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Waiter order capture, kitchen execution, serving handoff, and controlled bill waiting.
            </p>
          </div>
          <StatusBadge tone="green">Tenant scoped</StatusBadge>
        </div>
      </section>
      {query.error ? (
        <section className="rounded-md border border-destructive/40 bg-card p-4 text-sm text-destructive">
          {query.error.message}
        </section>
      ) : null}
      {page === "waiter-orders" ? (
        <ServiceOrdersForm busy={busy} onSave={(input) => actions.create.mutate(input)} />
      ) : null}
      {["overview", "waiter-orders", "kitchen", "ready", "bill-waiting", "history"].includes(
        page
      ) ? (
        <ServiceOrdersList
          busy={busy}
          records={query.data ?? []}
          onTransition={(id, next) => actions.transition.mutate({ id, status: next })}
        />
      ) : (
        <FoundationPanel page={page} />
      )}
    </main>
  );
}
function statusForPage(page: KitchenServePage): ServiceOrderStatus | undefined {
  if (page === "kitchen") return "preparing";
  if (page === "ready") return "ready";
  if (page === "bill-waiting") return "bill-waiting";
  return undefined;
}
function title(page: KitchenServePage) {
  return page
    .split("-")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}
function FoundationPanel({ page }: { page: KitchenServePage }) {
  return (
    <section className="rounded-md border bg-card p-5 shadow-sm">
      <h2 className="text-lg font-semibold">{title(page)}</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        This module is reserved for database-backed hotel configuration and will use Core masters
        where applicable. No fake operational records are loaded.
      </p>
    </section>
  );
}
