import { useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Printer, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { BillingLayout } from "../../shared/layout/BillingLayout";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import {
  createReceipt,
  deleteReceipt,
  listReceipts,
  setReceiptStatus,
  updateReceipt
} from "./receipt.services";
import type { Receipt, ReceiptInput } from "./receipt.types";
import { ReceiptPrint } from "./receipt.print";
import { ReceiptForm } from "./receipt.form";
type View = { mode: "list" } | { mode: "form"; item?: Receipt } | { mode: "show"; item: Receipt };
export function ReceiptPage() {
  const path = useRouterState({ select: (state) => state.location.pathname });
  return (
    <BillingLayout
      currentPath={path}
      headerTitle="Receipt"
      subtitle="Record customer receipts and allocations."
      title="Billing Workspace"
    >
      <ReceiptWorkspace />
    </BillingLayout>
  );
}
export function ReceiptWorkspace() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["billing", "receipts"], queryFn: listReceipts });
  const [view, setView] = useState<View>({ mode: "list" });
  const [search, setSearch] = useState("");
  const save = useMutation({
    mutationFn: (input: ReceiptInput) =>
      input.id ? updateReceipt(input.id, input) : createReceipt(input),
    onSuccess: async (item) => {
      await client.invalidateQueries({ queryKey: ["billing", "receipts"] });
      setView({ mode: "show", item });
    }
  });
  const status = useMutation({
    mutationFn: ({ id, value }: { id: string; value: "posted" | "cancelled" }) =>
      setReceiptStatus(id, value),
    onSuccess: async (item) => {
      await client.invalidateQueries({ queryKey: ["billing", "receipts"] });
      if (item) setView({ mode: "show", item });
    }
  });
  const remove = useMutation({
    mutationFn: deleteReceipt,
    onSuccess: () => client.invalidateQueries({ queryKey: ["billing", "receipts"] })
  });
  const items = (query.data ?? []).filter((item) =>
    [item.receiptNumber, item.partyName, item.receiptMode, item.status]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );
  if (view.mode === "form")
    return (
      <ReceiptForm
        {...(view.item ? { value: view.item } : {})}
        saving={save.isPending}
        onCancel={() => setView(view.item ? { mode: "show", item: view.item } : { mode: "list" })}
        onSave={(input) => save.mutate(input)}
      />
    );
  if (view.mode === "show")
    return (
      <ReceiptShow
        item={view.item}
        onBack={() => setView({ mode: "list" })}
        onEdit={() => setView({ mode: "form", item: view.item })}
        onStatus={(value) => status.mutate({ id: view.item.id, value })}
      />
    );
  return (
    <WorkspacePage
      title="Receipts"
      description="Create, review, and print receipt vouchers."
      action={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => query.refetch()}>
            <RefreshCw className="size-4" />
            Refresh
          </Button>
          <Button onClick={() => setView({ mode: "form" })}>
            <Plus className="size-4" />
            New receipt
          </Button>
        </div>
      }
    >
      <div className="rounded-md border bg-card p-4">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search receipt, customer, mode, or status"
        />
      </div>
      <div className="mt-4 overflow-x-auto rounded-md border bg-card shadow-sm">
        <table className="w-full min-w-[850px] text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              {[
                "Receipt no",
                "Date",
                "Customer",
                "Mode",
                "Amount",
                "Unallocated",
                "Status",
                "Action"
              ].map((label) => (
                <th className="px-4 py-3 text-left font-medium" key={label}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr className="border-b last:border-0" key={item.id}>
                <td className="px-4 py-3">
                  <button
                    className="font-medium hover:underline"
                    onClick={() => setView({ mode: "show", item })}
                  >
                    {item.receiptNumber}
                  </button>
                </td>
                <td className="px-4 py-3">{item.receiptDate}</td>
                <td className="px-4 py-3">{item.partyName}</td>
                <td className="px-4 py-3">{item.receiptMode}</td>
                <td className="px-4 py-3 text-right">{money(item.totalAmount)}</td>
                <td className="px-4 py-3 text-right">{money(item.unallocatedAmount)}</td>
                <td className="px-4 py-3">
                  <WorkspaceStatusBadge status={item.status} />
                </td>
                <td className="px-4 py-3">
                  <Button
                    size="icon"
                    variant="outline"
                    title="Delete draft"
                    disabled={item.status !== "draft"}
                    onClick={() => remove.mutate(item.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!items.length ? (
          <p className="p-10 text-center text-muted-foreground">No receipts found.</p>
        ) : null}
      </div>
    </WorkspacePage>
  );
}
function ReceiptShow({
  item,
  onBack,
  onEdit,
  onStatus
}: {
  item: Receipt;
  onBack: () => void;
  onEdit: () => void;
  onStatus: (value: "posted" | "cancelled") => void;
}) {
  return (
    <WorkspacePage
      title={item.receiptNumber}
      description={`${item.partyName} · ${item.receiptDate}`}
      onBack={onBack}
      action={
        <div className="flex gap-2">
          {item.status === "draft" ? (
            <>
              <Button variant="outline" onClick={onEdit}>
                <Pencil className="size-4" />
                Edit
              </Button>
              <Button onClick={() => onStatus("posted")}>Post</Button>
            </>
          ) : null}
          {item.status === "posted" ? (
            <Button variant="destructive" onClick={() => onStatus("cancelled")}>
              Cancel
            </Button>
          ) : null}
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="size-4" />
            Print
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <ReceiptPrint receipt={item} />
        <div className="rounded-md border bg-card p-5">
          <h2 className="font-semibold">Receipt summary</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <Summary label="Status" value={item.status} />
            <Summary label="Amount" value={money(item.amount)} />
            <Summary label="Allocated" value={money(item.allocatedAmount)} />
            <Summary label="Unallocated" value={money(item.unallocatedAmount)} />
            <Summary label="Total" value={money(item.totalAmount)} />
          </dl>
        </div>
      </div>
    </WorkspacePage>
  );
}
function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
function money(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value);
}
