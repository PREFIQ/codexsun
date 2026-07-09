import { useMemo, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import { WorkspaceFormField, WorkspaceFormGrid, WorkspaceFormPanel, WorkspaceSelect, WorkspaceUpsertPage } from "@codexsun/ui/workspace";
import { ledgerSchema, voucherSchema } from "./accounts.schema";
import type { AccountGroup, Ledger, LedgerClassification, LedgerSavePayload, VoucherSavePayload } from "./accounts.types";

const classifications: Array<{ label: string; value: LedgerClassification }> = [
  { label: "Customer", value: "customer" },
  { label: "Supplier", value: "supplier" },
  { label: "Sales", value: "sales" },
  { label: "Purchase", value: "purchase" },
  { label: "GST Output", value: "gst_output" },
  { label: "GST Input", value: "gst_input" },
  { label: "Cash", value: "cash" },
  { label: "Bank", value: "bank" },
  { label: "Round Off", value: "round_off" },
  { label: "Discount", value: "discount" },
  { label: "Adjustment", value: "adjustment" }
];

export function LedgerForm({ groups, ledger, loading, saveError, onBack, onSave }: { groups: AccountGroup[]; ledger: Ledger | null; loading: boolean; saveError?: string; onBack: () => void; onSave: (payload: LedgerSavePayload) => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<LedgerSavePayload>({
    classification: ledger?.classification ?? "customer",
    code: ledger?.code ?? "",
    groupId: ledger?.groupId ?? groups[0]?.id ?? "",
    name: ledger?.name ?? "",
    openingBalance: ledger?.openingBalance ?? 0,
    status: ledger?.status ?? "active",
    tallyLedgerName: ledger?.tallyLedgerName ?? ledger?.name ?? ""
  });
  const result = useMemo(() => ledgerSchema.safeParse(form), [form]);
  const errors = submitted && !result.success ? result.error.issues.map((issue) => issue.message) : [];

  return (
    <WorkspaceUpsertPage title={ledger ? "Edit Ledger" : "New Ledger"} description="Create ledgers for double-entry vouchers and Tally-ready posting." onBack={onBack}>
      <form noValidate onSubmit={(event) => { event.preventDefault(); setSubmitted(true); if (result.success) onSave(result.data); }}>
        <WorkspaceFormPanel title="Ledger details">
          {[...errors, ...(saveError ? [saveError] : [])].length ? <WorkspaceFormBanner title="Unable to save">{[...errors, ...(saveError ? [saveError] : [])].join(" ")}</WorkspaceFormBanner> : null}
          <WorkspaceFormGrid>
            <WorkspaceFormField label="Ledger name" required><Input value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} /></WorkspaceFormField>
            <WorkspaceFormField label="Code" required><Input value={form.code} onChange={(event) => setForm((value) => ({ ...value, code: event.target.value }))} /></WorkspaceFormField>
            <WorkspaceFormField label="Group" required>
              <WorkspaceSelect value={form.groupId} options={groups.map((group) => ({ label: group.name, value: group.id }))} onValueChange={(groupId) => setForm((value) => ({ ...value, groupId }))} />
            </WorkspaceFormField>
            <WorkspaceFormField label="Classification" required>
              <WorkspaceSelect value={form.classification} options={classifications} onValueChange={(classification) => setForm((value) => ({ ...value, classification: classification as LedgerClassification }))} />
            </WorkspaceFormField>
            <WorkspaceFormField label="Opening balance"><Input type="number" value={form.openingBalance} onChange={(event) => setForm((value) => ({ ...value, openingBalance: Number(event.target.value || 0) }))} /></WorkspaceFormField>
            <WorkspaceFormField label="Status"><WorkspaceSelect value={form.status} options={[{ label: "Active", value: "active" }, { label: "Inactive", value: "inactive" }]} onValueChange={(status) => setForm((value) => ({ ...value, status: status as "active" | "inactive" }))} /></WorkspaceFormField>
            <WorkspaceFormField label="Tally ledger name"><Input value={form.tallyLedgerName ?? ""} onChange={(event) => setForm((value) => ({ ...value, tallyLedgerName: event.target.value }))} /></WorkspaceFormField>
          </WorkspaceFormGrid>
        </WorkspaceFormPanel>
        <div className="mt-5 flex justify-end gap-2 border-t pt-4">
          <Button type="button" variant="outline" onClick={onBack}><ArrowLeft className="size-4" />Cancel</Button>
          <Button type="submit" disabled={loading}><Save className="size-4" />{ledger ? "Update" : "Save"}</Button>
        </div>
      </form>
    </WorkspaceUpsertPage>
  );
}

export function VoucherForm({ ledgers, loading, saveError, onBack, onSave }: { ledgers: Ledger[]; loading: boolean; saveError?: string; onBack: () => void; onSave: (payload: VoucherSavePayload) => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<VoucherSavePayload>({
    lines: [
      { amount: 0, dc: "debit", ledgerId: ledgers[0]?.id ?? "" },
      { amount: 0, dc: "credit", ledgerId: ledgers[1]?.id ?? ledgers[0]?.id ?? "" }
    ],
    narration: "",
    status: "posted",
    voucherDate: new Date().toISOString().slice(0, 10),
    voucherType: "journal"
  });
  const result = useMemo(() => voucherSchema.safeParse(form), [form]);
  const balanced = form.lines.reduce((sum, line) => sum + (line.dc === "debit" ? line.amount : -line.amount), 0) === 0;
  const errors = submitted && (!result.success || !balanced) ? [...(!result.success ? result.error.issues.map((issue) => issue.message) : []), ...(!balanced ? ["Debit and credit totals must match."] : [])] : [];

  return (
    <WorkspaceUpsertPage title="New Voucher" description="Manual double-entry voucher. Billing postings are created through the backend posting contract." onBack={onBack}>
      <form noValidate onSubmit={(event) => { event.preventDefault(); setSubmitted(true); if (result.success && balanced) onSave(result.data); }}>
        <WorkspaceFormPanel title="Voucher details">
          {[...errors, ...(saveError ? [saveError] : [])].length ? <WorkspaceFormBanner title="Unable to save">{[...errors, ...(saveError ? [saveError] : [])].join(" ")}</WorkspaceFormBanner> : null}
          <WorkspaceFormGrid>
            <WorkspaceFormField label="Date" required><Input type="date" value={form.voucherDate} onChange={(event) => setForm((value) => ({ ...value, voucherDate: event.target.value }))} /></WorkspaceFormField>
            <WorkspaceFormField label="Voucher type" required>
              <WorkspaceSelect value={form.voucherType} options={["sales", "purchase", "receipt", "payment", "contra", "journal", "credit_note", "debit_note"].map((value) => ({ label: value.replace("_", " "), value }))} onValueChange={(voucherType) => setForm((value) => ({ ...value, voucherType: voucherType as VoucherSavePayload["voucherType"] }))} />
            </WorkspaceFormField>
            <WorkspaceFormField className="md:col-span-2" label="Narration"><Input value={form.narration ?? ""} onChange={(event) => setForm((value) => ({ ...value, narration: event.target.value }))} /></WorkspaceFormField>
          </WorkspaceFormGrid>
        </WorkspaceFormPanel>
        <WorkspaceFormPanel title="Lines">
          <div className="space-y-3">
            {form.lines.map((line, index) => (
              <div className="grid gap-3 rounded-md border p-3 md:grid-cols-[1fr_9rem_10rem]" key={index}>
                <WorkspaceFormField label="Ledger" required><WorkspaceSelect value={line.ledgerId} options={ledgers.map((ledger) => ({ label: ledger.name, value: ledger.id }))} onValueChange={(ledgerId) => updateLine(index, { ledgerId })} /></WorkspaceFormField>
                <WorkspaceFormField label="Debit/Credit" required><WorkspaceSelect value={line.dc} options={[{ label: "Debit", value: "debit" }, { label: "Credit", value: "credit" }]} onValueChange={(dc) => updateLine(index, { dc: dc as "debit" | "credit" })} /></WorkspaceFormField>
                <WorkspaceFormField label="Amount" required><Input type="number" value={line.amount} onChange={(event) => updateLine(index, { amount: Number(event.target.value || 0) })} /></WorkspaceFormField>
              </div>
            ))}
          </div>
        </WorkspaceFormPanel>
        <div className="mt-5 flex justify-end gap-2 border-t pt-4">
          <Button type="button" variant="outline" onClick={onBack}><ArrowLeft className="size-4" />Cancel</Button>
          <Button type="submit" disabled={loading}><Save className="size-4" />Save</Button>
        </div>
      </form>
    </WorkspaceUpsertPage>
  );

  function updateLine(index: number, patch: Partial<VoucherSavePayload["lines"][number]>) {
    setForm((value) => ({ ...value, lines: value.lines.map((line, lineIndex) => lineIndex === index ? { ...line, ...patch } : line) }));
  }
}
