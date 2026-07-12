import { useState } from "react";
import { ArrowLeft, Save, X } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Switch } from "@codexsun/ui/components/switch";
import {
  WorkspaceFormActions,
  WorkspaceFormBody,
  WorkspaceFormField,
  WorkspaceFormGrid,
  WorkspaceFormSurface
} from "@codexsun/ui/workspace/upsert";
import type { ContactRecord, ContactSavePayload } from "./contact.types";
export function ContactForm({
  error,
  loading,
  onBack,
  onSubmit,
  record,
  records
}: {
  error: string;
  loading: boolean;
  onBack: () => void;
  onSubmit: (payload: ContactSavePayload) => void;
  record: ContactRecord | null;
  records: ContactRecord[];
}) {
  const [form, setForm] = useState<ContactSavePayload>(() =>
    record
      ? { ...record }
      : {
          code: nextCode(records),
          name: "",
          isActive: true,
          status: "active",
          openingBalance: 0,
          creditLimit: 0
        }
  );
  const set = (key: keyof ContactSavePayload, value: unknown) =>
    setForm((current) => ({ ...current, [key]: value }));
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{record ? "Edit Contact" : "New Contact"}</h1>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="size-4" />
          Back
        </Button>
      </div>
      <WorkspaceFormSurface>
        <WorkspaceFormBody>
          <WorkspaceFormGrid columns={2}>
            {fields.map((field) => {
              const { key, label } = field;
              const type = "type" in field ? field.type : undefined;
              return (
                <WorkspaceFormField
                  key={key}
                  label={label}
                  required={key === "name" || key === "code"}
                >
                  <Input
                    type={type ?? "text"}
                    value={String(form[key] ?? "")}
                    onChange={(event) =>
                      set(
                        key,
                        type === "number" ? Number(event.target.value || 0) : event.target.value
                      )
                    }
                  />
                </WorkspaceFormField>
              );
            })}
            <WorkspaceFormField label="Active">
              <div className="flex h-11 items-center justify-between rounded-md border px-3">
                <span className="text-sm">Available for use</span>
                <Switch
                  checked={form.isActive !== false}
                  onCheckedChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      isActive: value,
                      status: value ? "active" : "inactive"
                    }))
                  }
                />
              </div>
            </WorkspaceFormField>
          </WorkspaceFormGrid>
          {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
        </WorkspaceFormBody>
        <WorkspaceFormActions>
          <Button
            disabled={loading || !form.name.trim() || !form.code?.trim()}
            onClick={() => onSubmit(form)}
          >
            <Save className="size-4" />
            Save
          </Button>
          <Button variant="outline" onClick={onBack}>
            <X className="size-4" />
            Cancel
          </Button>
        </WorkspaceFormActions>
      </WorkspaceFormSurface>
    </section>
  );
}
const fields = [
  { key: "name", label: "Contact name" },
  { key: "code", label: "Code" },
  { key: "legalName", label: "Legal name" },
  { key: "primaryPhone", label: "Phone" },
  { key: "primaryEmail", label: "Email", type: "email" },
  { key: "gstin", label: "GSTIN" },
  { key: "pan", label: "PAN" },
  { key: "website", label: "Website" },
  { key: "openingBalance", label: "Opening balance", type: "number" },
  { key: "creditLimit", label: "Credit limit", type: "number" },
  { key: "description", label: "Description" }
] as const;
function nextCode(records: ContactRecord[]) {
  const next =
    records.reduce((value, record) => {
      const match = /^C-(\d+)$/i.exec(record.code);
      return match ? Math.max(value, Number(match[1])) : value;
    }, 0) + 1;
  return `C-${String(next).padStart(4, "0")}`;
}
