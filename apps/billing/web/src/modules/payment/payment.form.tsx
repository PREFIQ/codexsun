import { useEffect, useState } from "react";
import { Save, X } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Textarea } from "@codexsun/ui/components/textarea";
import { WorkspaceAnimatedTabs, type WorkspaceAnimatedTab } from "@codexsun/ui/workspace/animated-tabs";
import { WorkspaceDatePicker } from "@codexsun/ui/workspace/date-picker";
import { WorkspaceSelect } from "@codexsun/ui/workspace/select";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspaceFormActions, WorkspaceFormField, WorkspaceFormGrid, WorkspaceFormPanel } from "@codexsun/ui/workspace/upsert";
import { getBillingSettings } from "../billing-settings/billing-settings.services";
import { formatDocumentNumber } from "../settings/settings.types";
import type { Payment, PaymentInput } from "./payment.types";

const modes = [{ label: "Cash", value: "cash" }, { label: "Bank account", value: "bank" }, { label: "UPI", value: "upi" }, { label: "NEFT / RTGS", value: "transfer" }];

export function PaymentForm({ value, saving, onCancel, onSave }: { value?: Payment | undefined; saving: boolean; onCancel: () => void; onSave: (value: PaymentInput) => void }) {
  const [form, setForm] = useState<PaymentInput>(() => value ? { ...value } : { paymentDate: new Date().toISOString().slice(0, 10), partyName: "", amount: 0, paymentMode: "cash", status: "draft", allocations: [] });
  const [tab, setTab] = useState("details");
  useEffect(() => { if (value?.paymentNumber) return; void getBillingSettings().then(settings => setForm(current => current.paymentNumber ? current : { ...current, paymentNumber: formatDocumentNumber(settings.numbering.payment) })); }, [value?.paymentNumber]);
  const patch = (key: keyof PaymentInput, next: string | number) => setForm(current => ({ ...current, [key]: next }));
  const details = <WorkspaceFormGrid>
    <WorkspaceFormField label="Supplier name *"><Input required value={form.partyName} onChange={event => patch("partyName", event.target.value)} placeholder="Search or enter supplier" /></WorkspaceFormField>
    <WorkspaceFormField label="Payment no"><Input value={form.paymentNumber ?? ""} onChange={event => patch("paymentNumber", event.target.value)} /></WorkspaceFormField>
    <WorkspaceFormField label="Amount *"><Input required type="number" min="0" step="0.01" value={form.amount} onChange={event => patch("amount", Number(event.target.value))} /></WorkspaceFormField>
    <WorkspaceFormField label="Date *"><WorkspaceDatePicker required value={form.paymentDate} onValueChange={value => patch("paymentDate", value)} /></WorkspaceFormField>
    <WorkspaceFormField label="Work order no"><Input value={form.referenceNo ?? ""} onChange={event => patch("referenceNo", event.target.value)} placeholder="Optional" /></WorkspaceFormField>
    <WorkspaceFormField label="Mode of payment"><WorkspaceSelect ariaLabel="Mode of payment" options={modes} value={String(form.paymentMode ?? "cash")} onValueChange={value => patch("paymentMode", value)} /></WorkspaceFormField>
    <WorkspaceFormField className="md:col-start-2" label={form.paymentMode === "cash" ? "Cash ledger *" : "Bank ledger *"}><WorkspaceSelect ariaLabel="Ledger" options={form.paymentMode === "cash" ? [{ label: "Cash", value: "Cash" }] : [{ label: "Primary bank account", value: "Primary bank account" }]} value={String(form.bankAccount || (form.paymentMode === "cash" ? "Cash" : "Primary bank account"))} onValueChange={value => patch("bankAccount", value)} /></WorkspaceFormField>
    <WorkspaceFormField className="md:col-start-2" label="Notes"><Textarea value={form.notes ?? ""} onChange={event => patch("notes", event.target.value)} placeholder="Add payment notes" rows={4} /></WorkspaceFormField>
  </WorkspaceFormGrid>;
  const allocation = <div className="space-y-4"><div className="rounded-md border border-dashed p-5 text-sm text-muted-foreground">Allocate this payment against purchase bills in the next step.</div><WorkspaceFormGrid><WorkspaceFormField label="Bill no"><Input placeholder="Select purchase bill" /></WorkspaceFormField><WorkspaceFormField label="Allocated amount"><Input type="number" min="0" step="0.01" placeholder="0.00" /></WorkspaceFormField></WorkspaceFormGrid></div>;
  const tabs: WorkspaceAnimatedTab[] = [{ value: "details", label: "Details", content: details }, { value: "allocations", label: "Allocations", content: allocation }];
  return <WorkspacePage title={value ? "Edit payment" : "New payment"} description="Create an outgoing payment with allocation details." onBack={onCancel}><form onSubmit={event => { event.preventDefault(); onSave(form); }}><WorkspaceFormPanel footer={<WorkspaceFormActions><Button type="submit" disabled={saving}><Save className="size-4" />{saving ? "Saving..." : "Save"}</Button><Button type="button" variant="outline" onClick={onCancel}><X className="size-4" />Cancel</Button></WorkspaceFormActions>}><WorkspaceAnimatedTabs tabs={tabs} value={tab} onValueChange={setTab} contentClassName="min-h-[25rem]" /></WorkspaceFormPanel></form></WorkspacePage>;
}
