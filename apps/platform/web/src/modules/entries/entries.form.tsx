import { useMemo, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { WorkspaceFormField, WorkspaceFormGrid, WorkspaceFormPanel } from "@codexsun/ui/workspace";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import { entryQuickFormSchema } from "./entries.schema";

export type EntryQuickFormPayload = {
  customerName: string;
  documentDate: string;
  documentNo: string;
};

export function EntryQuickForm({ loading, onSave }: { loading: boolean; onSave: (payload: EntryQuickFormPayload) => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<EntryQuickFormPayload>({ customerName: "", documentDate: new Date().toISOString().slice(0, 10), documentNo: "" });
  const result = useMemo(() => entryQuickFormSchema.safeParse(form), [form]);
  const errors = submitted && !result.success ? result.error.issues.map((issue) => issue.message) : [];

  return (
    <form noValidate onSubmit={(event) => { event.preventDefault(); setSubmitted(true); if (result.success) onSave(result.data); }}>
      <WorkspaceFormPanel title="Entry details">
        {errors.length ? <WorkspaceFormBanner title="Unable to save">{errors.join(" ")}</WorkspaceFormBanner> : null}
        <WorkspaceFormGrid>
          <WorkspaceFormField label="Document number" required><Input value={form.documentNo} onChange={(event) => setForm((value) => ({ ...value, documentNo: event.target.value }))} /></WorkspaceFormField>
          <WorkspaceFormField label="Document date" required><Input type="date" value={form.documentDate} onChange={(event) => setForm((value) => ({ ...value, documentDate: event.target.value }))} /></WorkspaceFormField>
          <WorkspaceFormField className="md:col-span-2" label="Customer" required><Input value={form.customerName} onChange={(event) => setForm((value) => ({ ...value, customerName: event.target.value }))} /></WorkspaceFormField>
        </WorkspaceFormGrid>
      </WorkspaceFormPanel>
      <div className="mt-5 flex justify-end border-t pt-4">
        <Button type="submit" disabled={loading}><Save className="size-4" />Save</Button>
      </div>
    </form>
  );
}
