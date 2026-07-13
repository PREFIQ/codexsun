import { useState } from "react";
import { ArrowLeft, Save, X } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Switch } from "@codexsun/ui/components/switch";
import {
  WorkspaceFormActions,
  WorkspaceFormBanner,
  WorkspaceFormBody,
  WorkspaceFormField,
  WorkspaceFormGrid,
  WorkspaceFormSurface
} from "@codexsun/ui/workspace/upsert";
import { workOrderSchema } from "./work-order.schema";
import type { WorkOrderRecord, WorkOrderSavePayload } from "./work-order.types";
export function WorkOrderForm({
  error,
  existingRecords,
  loading,
  onBack,
  onSubmit,
  record
}: {
  error: string;
  existingRecords: WorkOrderRecord[];
  loading: boolean;
  onBack: () => void;
  onSubmit: (payload: WorkOrderSavePayload) => void;
  record: WorkOrderRecord | null;
}) {
  const [validationError, setValidationError] = useState("");
  const [form, setForm] = useState<WorkOrderSavePayload>(() =>
    record
      ? { code: record.code, isActive: record.isActive, name: record.name, status: record.status }
      : { code: nextCode(existingRecords), isActive: true, name: "", status: "active" }
  );
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{record ? "Edit Work Order" : "New Work Order"}</h1>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="size-4" />
          Back
        </Button>
      </div>
      <WorkspaceFormSurface>
        <WorkspaceFormBody>
          <WorkspaceFormGrid columns={2}>
            <WorkspaceFormField label="Work order name" required>
              <Input
                value={form.name ?? ""}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </WorkspaceFormField>
            <WorkspaceFormField label="Code" required>
              <Input
                value={form.code ?? ""}
                onChange={(event) =>
                  setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))
                }
              />
            </WorkspaceFormField>
            <WorkspaceFormField label="Active">
              <div className="flex h-11 items-center justify-between rounded-md border px-3">
                <span className="text-sm">Available for use</span>
                <Switch
                  checked={form.isActive !== false}
                  onCheckedChange={(isActive) =>
                    setForm((current) => ({
                      ...current,
                      isActive,
                      status: isActive ? "active" : "inactive"
                    }))
                  }
                />
              </div>
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
            disabled={loading || !form.name?.trim() || !form.code?.trim()}
            onClick={() => {
              const result = workOrderSchema.safeParse(form);
              if (!result.success) {
                setValidationError(
                  result.error.issues[0]?.message ?? "Check the work order details."
                );
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
function nextCode(records: WorkOrderRecord[]) {
  const next =
    records.reduce((highest, record) => {
      const match = /^WO-(\d+)$/i.exec(record.code);
      return match ? Math.max(highest, Number(match[1])) : highest;
    }, 0) + 1;
  return `WO-${String(next).padStart(4, "0")}`;
}
