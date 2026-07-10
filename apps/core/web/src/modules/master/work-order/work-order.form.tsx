import { useState, type Dispatch, type SetStateAction } from "react";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Switch } from "@codexsun/ui/components/switch";
import { WorkspaceLookup, type WorkspaceLookupOption } from "@codexsun/ui/workspace/lookup";
import { WorkspaceFormActions, WorkspaceFormBody, WorkspaceFormField, WorkspaceFormGrid, WorkspaceFormSurface } from "@codexsun/ui/workspace/upsert";
import { cn } from "@codexsun/ui/lib/utils";
import { commonMasterDefinitions } from "../../common/registry";
import { createCommonMaster } from "../../common-master/common-master.services";
import { listWorkOrderLookup, type WorkOrderLookupRecord } from "./work-order.services";
import type { WorkOrderRecord, WorkOrderSavePayload } from "./work-order.types";

type LookupKey = "workOrderTypes";
type LookupOption = WorkspaceLookupOption & { record?: WorkOrderLookupRecord };
type LookupState = Record<LookupKey, LookupOption[]>;

const commonMasterPathByKey = Object.fromEntries(commonMasterDefinitions.map((definition) => [definition.key, definition.path]));

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
  const queryClient = useQueryClient();
  const [form, setForm] = useState<WorkOrderSavePayload>(() => record ? { ...record } : blankWorkOrder(existingRecords));
  const lookups = useWorkOrderLookups();
  const createWorkOrderType = useMutation({
    mutationFn: (name: string) => createCommonMaster(lookupPath("workOrderTypes"), { isActive: true, name }),
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: ["core", "work-order", "lookup", "workOrderTypes"] });
      toast.success("Work order type created", { description: String(created.name ?? "Created") });
    }
  });
  const title = record ? "Edit Work Order" : "New Work Order";
  const codeLabel = String(form.code ?? "").trim();

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="min-w-0 truncate text-xl font-semibold tracking-normal sm:text-2xl">{title}</h1>
          {codeLabel ? <span className="inline-flex h-7 items-center rounded-md border border-border/90 bg-card px-2.5 text-xs font-semibold uppercase leading-none text-muted-foreground shadow-sm">{codeLabel}</span> : null}
        </div>
        <Button className="shrink-0 rounded-md" variant="outline" onClick={onBack}><ArrowLeft className="size-4" />Back</Button>
      </div>
      <WorkspaceFormSurface>
        <WorkspaceFormBody className="pb-10">
          <WorkOrderFields form={form} lookups={lookups} setForm={setForm} onCreateWorkOrderType={async (name) => {
            const created = await createWorkOrderType.mutateAsync(name);
            return { label: String(created.name ?? name), value: created.id };
          }} />
          {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
        </WorkspaceFormBody>
        <WorkspaceFormActions>
          <Button disabled={loading || !String(form.name ?? "").trim()} onClick={() => onSubmit(form)}><Save className="size-4" />Save</Button>
          <Button variant="outline" onClick={onBack}><X className="size-4" />Cancel</Button>
        </WorkspaceFormActions>
      </WorkspaceFormSurface>
    </section>
  );
}

function WorkOrderFields({ form, lookups, onCreateWorkOrderType, setForm }: { form: WorkOrderSavePayload; lookups: LookupState; onCreateWorkOrderType: (name: string) => Promise<WorkspaceLookupOption | undefined>; setForm: Dispatch<SetStateAction<WorkOrderSavePayload>> }) {
  return (
    <WorkspaceFormGrid columns={2}>
      <Field label="Work order name" required><Input value={String(form.name ?? "")} onChange={(event) => patch(setForm, { name: event.target.value })} /></Field>
      <Field label="Code"><Input value={String(form.code ?? "")} onChange={(event) => patch(setForm, { code: event.target.value.toUpperCase() })} /></Field>
      <LookupField createLabel="Create work order type" label="Work Order Type" options={lookups.workOrderTypes} value={form.typeId ?? form.typeName} onCreate={onCreateWorkOrderType} onPick={(id, label) => patch(setForm, { typeId: id, typeName: label })} />
      <SwitchRow label="Active" checked={form.isActive !== false} onChange={(isActive) => patch(setForm, { isActive, status: isActive ? "active" : "not_active" })} />
    </WorkspaceFormGrid>
  );
}

function LookupField({ createLabel, label, onCreate, onPick, options, value }: { createLabel?: string; label: string; onCreate?: (name: string) => Promise<WorkspaceLookupOption | undefined>; onPick: (id: string, label: string, option?: LookupOption | null) => void; options: LookupOption[]; value: unknown }) {
  const createProps = onCreate ? {
    createLabel,
    createMode: "inline" as const,
    emptyLabel: `No ${label.toLowerCase()} found. Type a name to create it.`,
    onCreate
  } : { createMode: "none" as const };
  return (
    <Field label={label}>
      <WorkspaceLookup
        {...createProps}
        allowTextValue={!onCreate}
        options={options}
        value={String(value ?? "")}
        onValueChange={(selected, option) => onPick(selected, option?.label ?? selected, option as LookupOption | null | undefined)}
      />
    </Field>
  );
}

function useWorkOrderLookups(): LookupState {
  const paths: Record<LookupKey, string> = {
    workOrderTypes: lookupPath("workOrderTypes")
  };
  const entries = Object.entries(paths) as Array<[LookupKey, string]>;
  const queries = useQueries({
    queries: entries.map(([key, path]) => ({
      enabled: Boolean(path),
      queryFn: () => listWorkOrderLookup(path),
      queryKey: ["core", "work-order", "lookup", key]
    }))
  });
  return Object.fromEntries(entries.map(([key], index) => [key, (queries[index]?.data ?? []).map((record) => toLookupOption(record))])) as LookupState;
}

function toLookupOption(record: WorkOrderLookupRecord): LookupOption {
  const label = String(record.name ?? record.code ?? record.description ?? record.id);
  return { label, record, value: record.id };
}

function lookupPath(key: string) {
  return commonMasterPathByKey[key] ?? "";
}

function Field({ children, label, required }: { children: React.ReactNode; label: string; required?: boolean }) {
  return <WorkspaceFormField label={label} {...(required ? { required: true } : {})}>{children}</WorkspaceFormField>;
}

function SwitchRow({ checked, label, onChange }: { checked: boolean; label: string; onChange: (checked: boolean) => void }) {
  return <div className="flex min-h-[66px] flex-col justify-end gap-1.5">
    <span className="invisible text-sm font-medium leading-none">Field</span>
    <div className={cn("flex h-11 items-center justify-between rounded-md border px-3 transition-colors", checked ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-border bg-muted/35 text-muted-foreground")}>
      <span className="inline-flex items-center gap-2 text-sm font-semibold">
        {checked ? <CheckCircle2 className="size-3.5 text-emerald-600" /> : null}
        {label}
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  </div>;
}

function blankWorkOrder(existingRecords: WorkOrderRecord[]): WorkOrderSavePayload {
  return {
    code: nextWorkOrderCode(existingRecords),
    isActive: true,
    name: "",
    status: "active"
  };
}

function nextWorkOrderCode(records: WorkOrderRecord[]) {
  const next = records.reduce((highest, record) => {
    const match = /^WO-(\d+)$/i.exec(String(record.code ?? "").trim());
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0) + 1;
  return `WO-${String(next).padStart(4, "0")}`;
}

function patch(setForm: Dispatch<SetStateAction<WorkOrderSavePayload>>, value: WorkOrderSavePayload) {
  setForm((current) => ({ ...current, ...value }));
}
