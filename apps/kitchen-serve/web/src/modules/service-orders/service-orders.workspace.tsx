import { StatusBadge } from "@codexsun/ui";
import { ServiceOrdersForm } from "./service-orders.form";
import { useServiceOrderActions, useServiceOrders } from "./service-orders.hooks";
import { ServiceOrdersList } from "./service-orders.list";
import {
  FloorTablesPanel,
  MenuPanel,
  OrderQueuePanel,
  SettingsPanel
} from "./service-orders.operations";
import type { KitchenServePage } from "./service-orders.types";
export function ServiceOrdersWorkspace({ page }: { page: KitchenServePage }) {
  const usesOrders = [
    "overview",
    "waiter-orders",
    "kitchen",
    "ready",
    "bill-waiting",
    "history"
  ].includes(page);
  const query = useServiceOrders(undefined, usesOrders);
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
          <div className="flex items-center gap-2">
            <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
            <StatusBadge tone="green">Live sync · 2 sec</StatusBadge>
          </div>
        </div>
      </section>
      {usesOrders && query.error ? (
        <section className="rounded-md border border-destructive/40 bg-card p-4 text-sm text-destructive">
          {query.error.message}
        </section>
      ) : null}
      {page === "tables" && <FloorTablesPanel />}
      {page === "menu" && <MenuPanel />}
      {page === "settings" && <SettingsPanel />}
      {page === "waiter-orders" && (
        <>
          <ServiceOrdersForm busy={busy} onSave={(input) => actions.create.mutate(input)} />
          <ServiceOrdersList
            busy={busy}
            records={query.data ?? []}
            onTransition={(id, next) => actions.transition.mutate({ id, status: next })}
          />
        </>
      )}
      {["overview", "kitchen", "ready", "bill-waiting", "history"].includes(page) && (
        <OrderQueuePanel
          page={page}
          busy={busy}
          records={query.data ?? []}
          onTransition={(id, next) => actions.transition.mutate({ id, status: next })}
        />
      )}
    </main>
  );
}
function title(page: KitchenServePage) {
  return page
    .split("-")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}
