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
import type { Receipt, ReceiptInput } from "./receipt.types";

const modes = [{ label: "Cash", value: "cash" }, { label: "Bank account", value: "bank" }, { label: "UPI", value: "upi" }, { label: "NEFT / RTGS", value: "transfer" }];

export function ReceiptForm({ value, saving, onCancel, onSave }: { value?: Receipt | undefined; saving: boolean; onCancel: () => void; onSave: (value: ReceiptInput) => void }) {
  const [form, setForm] = useState<ReceiptInput>(() => value ? { ...value } : { receiptDate: new Date().toISOString().slice(0, 10), partyName: "", amount: 0, receiptMode: "cash", status: "draft", allocations: [] });
  const [tab, setTab] = useState("details");
  useEffect(() => { if (value?.receiptNumber) return; void getBillingSettings().then(settings => setForm(current => current.receiptNumber ? current : { ...current, receiptNumber: formatDocumentNumber(settings.numbering.receipt) })); }, [value?.receiptNumber]);
  const patch = (key: keyof ReceiptInput, next: string | number) => setForm(current => ({ ...current, [key]: next }));
  const details = <WorkspaceFormGrid>
    <WorkspaceFormField label="Customer name *"><Input required value={form.partyName} onChange={event => patch("partyName", event.target.value)} placeholder="Search or enter customer" /></WorkspaceFormField>
    <WorkspaceFormField label="Receipt no"><Input value={form.receiptNumber ?? ""} onChange={event => patch("receiptNumber", event.target.value)} /></WorkspaceFormField>
    <WorkspaceFormField label="Amount *"><Input required type="number" min="0" step="0.01" value={form.amount} onChange={event => patch("amount", Number(event.target.value))} /></WorkspaceFormField>
    <WorkspaceFormField label="Date *"><WorkspaceDatePicker required value={form.receiptDate} onValueChange={value => patch("receiptDate", value)} /></WorkspaceFormField>
    <WorkspaceFormField label="Work order no"><Input value={form.referenceNo ?? ""} onChange={event => patch("referenceNo", event.target.value)} placeholder="Optional" /></WorkspaceFormField>
    <WorkspaceFormField label="Mode of payment"><WorkspaceSelect ariaLabel="Mode of payment" options={modes} value={String(form.receiptMode ?? "cash")} onValueChange={value => patch("receiptMode", value)} /></WorkspaceFormField>
    <WorkspaceFormField className="md:col-start-2" label={form.receiptMode === "cash" ? "Cash ledger *" : "Bank ledger *"}><WorkspaceSelect ariaLabel="Ledger" options={form.receiptMode === "cash" ? [{ label: "Cash", value: "Cash" }] : [{ label: "Primary bank account", value: "Primary bank account" }]} value={String(form.bankAccount || (form.receiptMode === "cash" ? "Cash" : "Primary bank account"))} onValueChange={value => patch("bankAccount", value)} /></WorkspaceFormField>
    <WorkspaceFormField className="md:col-start-2" label="Notes"><Textarea value={form.notes ?? ""} onChange={event => patch("notes", event.target.value)} placeholder="Add receipt notes" rows={4} /></WorkspaceFormField>
  </WorkspaceFormGrid>;
  const allocation = <div className="space-y-4"><div className="rounded-md border border-dashed p-5 text-sm text-muted-foreground">Allocate this receipt against sales bills in the next step.</div><WorkspaceFormGrid><WorkspaceFormField label="Bill no"><Input placeholder="Select sales bill" /></WorkspaceFormField><WorkspaceFormField label="Allocated amount"><Input type="number" min="0" step="0.01" placeholder="0.00" /></WorkspaceFormField></WorkspaceFormGrid></div>;
  const tabs: WorkspaceAnimatedTab[] = [{ value: "details", label: "Details", content: details }, { value: "allocations", label: "Allocations", content: allocation }];
  return <WorkspacePage title={value ? "Edit receipt" : "New receipt"} description="Create a tabbed incoming receipt with allocation details." onBack={onCancel}><form onSubmit={event => { event.preventDefault(); onSave(form); }}><WorkspaceFormPanel footer={<WorkspaceFormActions><Button type="submit" disabled={saving}><Save className="size-4" />{saving ? "Saving..." : "Save"}</Button><Button type="button" variant="outline" onClick={onCancel}><X className="size-4" />Cancel</Button></WorkspaceFormActions>}><WorkspaceAnimatedTabs tabs={tabs} value={tab} onValueChange={setTab} contentClassName="min-h-[25rem]" /></WorkspaceFormPanel></form></WorkspacePage>;
}
