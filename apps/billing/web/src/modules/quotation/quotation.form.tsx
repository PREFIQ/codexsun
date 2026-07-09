import { useMemo, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import { WorkspaceFormField, WorkspaceFormGrid, WorkspaceFormPanel, WorkspaceSelect } from "@codexsun/ui/workspace";
import { quotationSchema } from "./quotation.schema";
import { createEmptyQuotationItem } from "./quotation.types";
import type { QuotationSavePayload } from "./quotation.types";

export function QuotationForm({ initialValue, loading, onSave }: { initialValue: QuotationSavePayload; loading: boolean; onSave: (payload: QuotationSavePayload) => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<QuotationSavePayload>(initialValue);
  const result = useMemo(() => quotationSchema.safeParse(form), [form]);
  const errors = submitted && !result.success ? result.error.issues.map((issue) => issue.message) : [];

  return (
    <form noValidate onSubmit={(event) => { event.preventDefault(); setSubmitted(true); if (result.success) onSave(form); }}>
      <WorkspaceFormPanel title="Quotation details">
        {errors.length ? <WorkspaceFormBanner title="Unable to save">{errors.join(" ")}</WorkspaceFormBanner> : null}
        <WorkspaceFormGrid>
          <WorkspaceFormField label="Quotation number" required><Input value={form.quotationNumber} onChange={(event) => setForm((value) => ({ ...value, quotationNumber: event.target.value }))} /></WorkspaceFormField>
          <WorkspaceFormField label="Date" required><Input type="date" value={form.date} onChange={(event) => setForm((value) => ({ ...value, date: event.target.value }))} /></WorkspaceFormField>
          <WorkspaceFormField className="md:col-span-2" label="Customer" required><Input value={form.customerName} onChange={(event) => setForm((value) => ({ ...value, customerName: event.target.value }))} /></WorkspaceFormField>
          <WorkspaceFormField label="Tax type"><WorkspaceSelect value={form.taxType} options={[{ label: "CGST + SGST", value: "cgst-sgst" }, { label: "IGST", value: "igst" }]} onValueChange={(taxType) => setForm((value) => ({ ...value, taxType: taxType as QuotationSavePayload["taxType"] }))} /></WorkspaceFormField>
        </WorkspaceFormGrid>
      </WorkspaceFormPanel>
      <div className="mt-4 flex justify-between gap-3 border-t pt-4">
        <Button type="button" variant="outline" onClick={() => setForm((value) => ({ ...value, items: [...value.items, createEmptyQuotationItem()] }))}>Add item</Button>
        <Button type="submit" disabled={loading}><Save className="size-4" />Save</Button>
      </div>
    </form>
  );
}
