import { useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Printer, RefreshCw, Save, Trash2, X } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { BillingLayout } from "../../shared/layout/BillingLayout";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import {
  WorkspaceFormActions,
  WorkspaceFormField,
  WorkspaceFormGrid,
  WorkspaceFormPanel
} from "@codexsun/ui/workspace/upsert";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import {
  createPayment,
  deletePayment,
  listPayments,
  setPaymentStatus,
  updatePayment
} from "./payment.services";
import { emptyPayment, type Payment, type PaymentInput } from "./payment.types";
import { PaymentPrint } from "./payment.print";
import { PaymentForm as PaymentUpsertForm } from "./payment.form";

type View = { mode: "list" } | { mode: "form"; item?: Payment } | { mode: "show"; item: Payment };
export function PaymentPage() {
  const path = useRouterState({ select: (state) => state.location.pathname });
  return (
    <BillingLayout
      currentPath={path}
      headerTitle="Payment"
      subtitle="Record supplier payments and allocations."
      title="Billing Workspace"
    >
      <PaymentWorkspace />
    </BillingLayout>
  );
}
export function PaymentWorkspace() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["billing", "payments"], queryFn: listPayments });
  const [view, setView] = useState<View>({ mode: "list" });
  const [search, setSearch] = useState("");
  const save = useMutation({
    mutationFn: (input: PaymentInput) =>
      input.id ? updatePayment(input.id, input) : createPayment(input),
    onSuccess: async (item) => {
      await client.invalidateQueries({ queryKey: ["billing", "payments"] });
      setView({ mode: "show", item });
    }
  });
  const status = useMutation({
    mutationFn: ({ id, value }: { id: string; value: "posted" | "cancelled" }) =>
      setPaymentStatus(id, value),
    onSuccess: async (item) => {
      await client.invalidateQueries({ queryKey: ["billing", "payments"] });
      if (item) setView({ mode: "show", item });
    }
  });
  const remove = useMutation({
    mutationFn: deletePayment,
    onSuccess: () => client.invalidateQueries({ queryKey: ["billing", "payments"] })
  });
  const items = (query.data ?? []).filter((item) =>
    [item.paymentNumber, item.partyName, item.paymentMode, item.status]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );
  if (view.mode === "form")
    return (
      <PaymentUpsertForm
        {...(view.item ? { value: view.item } : {})}
        saving={save.isPending}
        onCancel={() => setView(view.item ? { mode: "show", item: view.item } : { mode: "list" })}
        onSave={(input) => save.mutate(input)}
      />
    );
  if (view.mode === "show")
    return (
      <PaymentShow
        item={view.item}
        onBack={() => setView({ mode: "list" })}
        onEdit={() => setView({ mode: "form", item: view.item })}
        onStatus={(value) => status.mutate({ id: view.item.id, value })}
      />
    );
  return (
    <WorkspacePage
      title="Payments"
      description="Create, review, and print payment vouchers."
      action={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => query.refetch()}>
            <RefreshCw className="size-4" />
            Refresh
          </Button>
          <Button onClick={() => setView({ mode: "form" })}>
            <Plus className="size-4" />
            New payment
          </Button>
        </div>
      }
    >
      <div className="rounded-md border bg-card p-4">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search payment, supplier, mode, or status"
        />
      </div>
      <div className="mt-4 overflow-x-auto rounded-md border bg-card shadow-sm">
        <table className="w-full min-w-[850px] text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              {[
                "Payment no",
                "Date",
                "Supplier",
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
                    {item.paymentNumber}
                  </button>
                </td>
                <td className="px-4 py-3">{item.paymentDate}</td>
                <td className="px-4 py-3">{item.partyName}</td>
                <td className="px-4 py-3">{item.paymentMode}</td>
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
          <p className="p-10 text-center text-muted-foreground">No payments found.</p>
        ) : null}
      </div>
    </WorkspacePage>
  );
}
function _PaymentForm({
  value,
  saving,
  onCancel,
  onSave
}: {
  value?: Payment;
  saving: boolean;
  onCancel: () => void;
  onSave: (value: PaymentInput) => void;
}) {
  const [form, setForm] = useState<PaymentInput>(() => (value ? { ...value } : emptyPayment()));
  const set = (key: keyof PaymentInput, value: string | number) =>
    setForm((current) => ({ ...current, [key]: value }));
  return (
    <WorkspacePage
      title={value ? "Edit Payment" : "New Payment"}
      description="Create an outgoing payment voucher."
      onBack={onCancel}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSave(form);
        }}
      >
        <WorkspaceFormPanel
          title="Payment details"
          footer={
            <WorkspaceFormActions>
              <Button type="submit" disabled={saving}>
                <Save className="size-4" />
                Save draft
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                <X className="size-4" />
                Cancel
              </Button>
            </WorkspaceFormActions>
          }
        >
          <WorkspaceFormGrid>
            <WorkspaceFormField label="Payment no">
              <Input
                value={form.paymentNumber ?? ""}
                onChange={(event) => set("paymentNumber", event.target.value)}
                placeholder="Automatic"
              />
            </WorkspaceFormField>
            <WorkspaceFormField label="Payment date" required>
              <Input
                type="date"
                value={form.paymentDate}
                onChange={(event) => set("paymentDate", event.target.value)}
              />
            </WorkspaceFormField>
            <WorkspaceFormField label="Supplier" required>
              <Input
                value={form.partyName}
                onChange={(event) => set("partyName", event.target.value)}
              />
            </WorkspaceFormField>
            <WorkspaceFormField label="Payment mode">
              <Input
                value={form.paymentMode ?? "cash"}
                onChange={(event) => set("paymentMode", event.target.value)}
              />
            </WorkspaceFormField>
            <WorkspaceFormField label="Amount" required>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(event) => set("amount", Number(event.target.value))}
              />
            </WorkspaceFormField>
            <WorkspaceFormField label="Reference no">
              <Input
                value={form.referenceNo ?? ""}
                onChange={(event) => set("referenceNo", event.target.value)}
              />
            </WorkspaceFormField>
            <WorkspaceFormField label="Notes" className="md:col-span-2">
              <Input
                value={form.notes ?? ""}
                onChange={(event) => set("notes", event.target.value)}
              />
            </WorkspaceFormField>
          </WorkspaceFormGrid>
        </WorkspaceFormPanel>
      </form>
    </WorkspacePage>
  );
}
function PaymentShow({
  item,
  onBack,
  onEdit,
  onStatus
}: {
  item: Payment;
  onBack: () => void;
  onEdit: () => void;
  onStatus: (value: "posted" | "cancelled") => void;
}) {
  return (
    <WorkspacePage
      title={item.paymentNumber}
      description={`${item.partyName} · ${item.paymentDate}`}
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
        <PaymentPrint payment={item} />
        <div className="rounded-md border bg-card p-5">
          <h2 className="font-semibold">Payment summary</h2>
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
