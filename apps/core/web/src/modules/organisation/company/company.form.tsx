import { useState } from "react";
import { ArrowLeft, Save, X } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import {
  WorkspaceFormActions,
  WorkspaceFormBanner,
  WorkspaceFormBody,
  WorkspaceFormField,
  WorkspaceFormGrid,
  WorkspaceFormSurface
} from "@codexsun/ui/workspace/upsert";
import { WorkspaceLookup } from "@codexsun/ui/workspace/lookup";
import { useCompanyIndustries } from "./company.hooks";
import { companySchema } from "./company.schema";
import type { CompanyRecord, CompanySavePayload } from "./company.types";
export function CompanyForm({
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
  onSubmit: (payload: CompanySavePayload) => void;
  record: CompanyRecord | null;
  records: CompanyRecord[];
}) {
  const [validationError, setValidationError] = useState("");
  const industries = useCompanyIndustries(),
    [form, setForm] = useState<CompanySavePayload>(() =>
      record
        ? { ...record }
        : { code: nextCode(records), name: "", isActive: true, status: "active" }
    );
  const set = (key: keyof CompanySavePayload, value: unknown) =>
    setForm((current) => ({ ...current, [key]: value }));
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{record ? "Edit Company" : "New Company"}</h1>
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
                    onChange={(event) => set(key, event.target.value)}
                  />
                </WorkspaceFormField>
              );
            })}
            <WorkspaceFormField label="Industry">
              <WorkspaceLookup
                options={(industries.data ?? []).map((item) => ({
                  label: item.name,
                  value: String(item.id)
                }))}
                value={String(form.industryId ?? "")}
                onValueChange={(value, option) =>
                  setForm((current) => ({
                    ...current,
                    industryId: value ? Number(value) : null,
                    industryName: option?.label ?? null
                  }))
                }
              />
            </WorkspaceFormField>
          </WorkspaceFormGrid>
          {validationError || error ? (
            <WorkspaceFormBanner title="Unable to save">
              {validationError || error}
            </WorkspaceFormBanner>
          ) : null}
        </WorkspaceFormBody>
        <WorkspaceFormActions>
          <Button
            disabled={loading || !form.name.trim() || !form.code?.trim()}
            onClick={() => {
              const result = companySchema.safeParse(form);
              if (!result.success) {
                setValidationError(result.error.issues[0]?.message ?? "Check the company details.");
                return;
              }
              setValidationError("");
              onSubmit(form);
            }}
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
  { key: "name", label: "Company name" },
  { key: "code", label: "Code" },
  { key: "legalName", label: "Legal name" },
  { key: "primaryPhone", label: "Phone" },
  { key: "primaryEmail", label: "Email", type: "email" },
  { key: "gstin", label: "GSTIN" },
  { key: "pan", label: "PAN" },
  { key: "website", label: "Website" },
  { key: "logoPath", label: "Light logo path" },
  { key: "logoDarkPath", label: "Dark logo path" },
  { key: "description", label: "Description" }
] as const;
function nextCode(records: CompanyRecord[]) {
  const next =
    records.reduce((value, record) => {
      const match = /^CO-(\d+)$/i.exec(record.code);
      return match ? Math.max(value, Number(match[1])) : value;
    }, 0) + 1;
  return `CO-${String(next).padStart(4, "0")}`;
}
