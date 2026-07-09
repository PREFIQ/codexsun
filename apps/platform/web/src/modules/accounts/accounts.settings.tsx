import { useEffect, useMemo, useState } from "react";
import { Save } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Switch } from "@codexsun/ui/components/switch";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import { WorkspaceFormField, WorkspaceFormGrid, WorkspaceFormPanel, WorkspaceSelect } from "@codexsun/ui/workspace";
import { accountsSettingsSchema } from "./accounts.schema";
import { saveAccountsSettings } from "./accounts.services";
import { useAccountsSettings } from "./accounts.hooks";
import type { AccountsSettings } from "./accounts.types";

const fallbackSettings: AccountsSettings = {
  financialYear: { allowBackdatedPosting: false, endDate: "2027-03-31", lockDate: null, startDate: "2026-04-01" },
  postingRules: { deletePolicy: "reverse_voucher", mode: "auto_post", postOnBillingDelete: true, postOnBillingSave: true, postOnBillingUpdate: true, roundOffLedgerCode: "ROUND_OFF" },
  tallyIntegration: { companyName: "", enabled: false, lastSyncAt: null, syncMode: "manual", tallyUrl: "http://localhost:9000" },
  voucherNumbering: { creditNotePrefix: "CN", debitNotePrefix: "DN", journalPrefix: "JV", mode: "auto", paymentPrefix: "PAY", receiptPrefix: "RCPT", salesPrefix: "SALE" }
};

export function AccountsSettingsWorkspace({ page = "accounts.settings" }: { page?: string }) {
  const queryClient = useQueryClient();
  const settingsQuery = useAccountsSettings();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<AccountsSettings>(fallbackSettings);

  useEffect(() => {
    if (settingsQuery.data) setForm(settingsQuery.data);
  }, [settingsQuery.data]);

  const result = useMemo(() => accountsSettingsSchema.safeParse(form), [form]);
  const errors = submitted && !result.success ? result.error.issues.map((issue) => issue.message) : [];
  const mutation = useMutation({
    mutationFn: saveAccountsSettings,
    onSuccess: async (settings) => {
      setForm(settings);
      await queryClient.invalidateQueries({ queryKey: ["accounts", "settings"] });
      toast.success("Accounts settings saved");
    },
    onError: (error) => toast.error("Unable to save accounts settings", { description: error instanceof Error ? error.message : "Please try again." })
  });

  function submit() {
    setSubmitted(true);
    if (result.success) mutation.mutate(result.data);
  }

  return (
    <div className="space-y-5">
      {errors.length ? <WorkspaceFormBanner title="Unable to save">{errors.join(" ")}</WorkspaceFormBanner> : null}
      {settingsQuery.error instanceof Error ? <WorkspaceFormBanner title="Unable to load">{settingsQuery.error.message}</WorkspaceFormBanner> : null}
      {page === "accounts.settings" || page === "accounts.financial-year" ? <FinancialYearPanel form={form} onChange={setForm} /> : null}
      {page === "accounts.settings" || page === "accounts.posting-rules" ? <PostingRulesPanel form={form} onChange={setForm} /> : null}
      {page === "accounts.settings" || page === "accounts.voucher-numbering" ? <VoucherNumberingPanel form={form} onChange={setForm} /> : null}
      {page === "accounts.settings" || page === "accounts.tally-integration" ? <TallyIntegrationPanel form={form} onChange={setForm} /> : null}
      <div className="flex justify-end border-t pt-4">
        <Button type="button" disabled={mutation.isPending || settingsQuery.isLoading} onClick={submit}><Save className="size-4" />Save settings</Button>
      </div>
    </div>
  );
}

function FinancialYearPanel({ form, onChange }: SettingsPanelProps) {
  return (
    <WorkspaceFormPanel title="Financial year">
      <WorkspaceFormGrid>
        <WorkspaceFormField label="Start date" required><Input type="date" value={form.financialYear.startDate} onChange={(event) => onChange({ ...form, financialYear: { ...form.financialYear, startDate: event.target.value } })} /></WorkspaceFormField>
        <WorkspaceFormField label="End date" required><Input type="date" value={form.financialYear.endDate} onChange={(event) => onChange({ ...form, financialYear: { ...form.financialYear, endDate: event.target.value } })} /></WorkspaceFormField>
        <WorkspaceFormField label="Lock date"><Input type="date" value={form.financialYear.lockDate ?? ""} onChange={(event) => onChange({ ...form, financialYear: { ...form.financialYear, lockDate: event.target.value || null } })} /></WorkspaceFormField>
        <ToggleField checked={form.financialYear.allowBackdatedPosting} label="Allow backdated posting" onChange={(checked) => onChange({ ...form, financialYear: { ...form.financialYear, allowBackdatedPosting: checked } })} />
      </WorkspaceFormGrid>
    </WorkspaceFormPanel>
  );
}

function PostingRulesPanel({ form, onChange }: SettingsPanelProps) {
  return (
    <WorkspaceFormPanel title="Posting rules">
      <WorkspaceFormGrid>
        <WorkspaceFormField label="Posting mode"><WorkspaceSelect value={form.postingRules.mode} options={[{ label: "Auto post", value: "auto_post" }, { label: "Draft review", value: "draft_review" }]} onValueChange={(mode) => onChange({ ...form, postingRules: { ...form.postingRules, mode: mode as AccountsSettings["postingRules"]["mode"] } })} /></WorkspaceFormField>
        <WorkspaceFormField label="Delete policy"><WorkspaceSelect value={form.postingRules.deletePolicy} options={[{ label: "Reverse voucher", value: "reverse_voucher" }, { label: "Delete draft only", value: "delete_draft_only" }]} onValueChange={(deletePolicy) => onChange({ ...form, postingRules: { ...form.postingRules, deletePolicy: deletePolicy as AccountsSettings["postingRules"]["deletePolicy"] } })} /></WorkspaceFormField>
        <WorkspaceFormField label="Round off ledger" required><Input value={form.postingRules.roundOffLedgerCode} onChange={(event) => onChange({ ...form, postingRules: { ...form.postingRules, roundOffLedgerCode: event.target.value } })} /></WorkspaceFormField>
        <ToggleField checked={form.postingRules.postOnBillingSave} label="Post on billing save" onChange={(checked) => onChange({ ...form, postingRules: { ...form.postingRules, postOnBillingSave: checked } })} />
        <ToggleField checked={form.postingRules.postOnBillingUpdate} label="Post on billing update" onChange={(checked) => onChange({ ...form, postingRules: { ...form.postingRules, postOnBillingUpdate: checked } })} />
        <ToggleField checked={form.postingRules.postOnBillingDelete} label="Post on billing delete" onChange={(checked) => onChange({ ...form, postingRules: { ...form.postingRules, postOnBillingDelete: checked } })} />
      </WorkspaceFormGrid>
    </WorkspaceFormPanel>
  );
}

function VoucherNumberingPanel({ form, onChange }: SettingsPanelProps) {
  return (
    <WorkspaceFormPanel title="Voucher numbering">
      <WorkspaceFormGrid>
        <WorkspaceFormField label="Mode"><WorkspaceSelect value={form.voucherNumbering.mode} options={[{ label: "Auto", value: "auto" }, { label: "Manual", value: "manual" }]} onValueChange={(mode) => onChange({ ...form, voucherNumbering: { ...form.voucherNumbering, mode: mode as AccountsSettings["voucherNumbering"]["mode"] } })} /></WorkspaceFormField>
        {(["salesPrefix", "receiptPrefix", "paymentPrefix", "journalPrefix", "debitNotePrefix", "creditNotePrefix"] as const).map((key) => (
          <WorkspaceFormField key={key} label={labelForPrefix(key)} required><Input value={form.voucherNumbering[key]} onChange={(event) => onChange({ ...form, voucherNumbering: { ...form.voucherNumbering, [key]: event.target.value } })} /></WorkspaceFormField>
        ))}
      </WorkspaceFormGrid>
    </WorkspaceFormPanel>
  );
}

function TallyIntegrationPanel({ form, onChange }: SettingsPanelProps) {
  return (
    <WorkspaceFormPanel title="Tally integration">
      <WorkspaceFormGrid>
        <ToggleField checked={form.tallyIntegration.enabled} label="Enable Tally sync" onChange={(checked) => onChange({ ...form, tallyIntegration: { ...form.tallyIntegration, enabled: checked } })} />
        <WorkspaceFormField label="Sync mode"><WorkspaceSelect value={form.tallyIntegration.syncMode} options={[{ label: "Manual", value: "manual" }, { label: "Auto", value: "auto" }]} onValueChange={(syncMode) => onChange({ ...form, tallyIntegration: { ...form.tallyIntegration, syncMode: syncMode as AccountsSettings["tallyIntegration"]["syncMode"] } })} /></WorkspaceFormField>
        <WorkspaceFormField label="Company name"><Input value={form.tallyIntegration.companyName} onChange={(event) => onChange({ ...form, tallyIntegration: { ...form.tallyIntegration, companyName: event.target.value } })} /></WorkspaceFormField>
        <WorkspaceFormField label="Tally URL" required><Input value={form.tallyIntegration.tallyUrl} onChange={(event) => onChange({ ...form, tallyIntegration: { ...form.tallyIntegration, tallyUrl: event.target.value } })} /></WorkspaceFormField>
      </WorkspaceFormGrid>
    </WorkspaceFormPanel>
  );
}

function ToggleField({ checked, label, onChange }: { checked: boolean; label: string; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex min-h-10 items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm font-medium">
      {label}
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

function labelForPrefix(key: keyof AccountsSettings["voucherNumbering"]) {
  return key.replace("Prefix", "").replace(/([A-Z])/g, " $1").trim();
}

type SettingsPanelProps = {
  form: AccountsSettings;
  onChange: (settings: AccountsSettings) => void;
};
