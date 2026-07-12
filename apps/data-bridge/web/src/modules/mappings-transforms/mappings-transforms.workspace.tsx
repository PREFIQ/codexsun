import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, GripVertical, Plus, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Checkbox } from "@codexsun/ui/components/checkbox";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspaceSelect } from "@codexsun/ui/workspace/select";
import { WorkspaceLookup } from "@codexsun/ui/workspace/lookup";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import {
  WorkspaceTableEmptyState,
  WorkspaceTableHeaderCell,
  WorkspaceTablePanel
} from "@codexsun/ui/workspace/table";
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions";
const base = import.meta.env.VITE_DATA_BRIDGE_API_URL ?? "http://127.0.0.1:7090";
type Column = { name: string; type: string };
type Table = { name: string; columns: Column[] };
type Snapshot = {
  id: number;
  jobName: string;
  sourceDatabase: string;
  targetDatabase: string;
  preparedAt: string | null;
};
type PlanSummary = {
  id: number;
  discoverySnapshotId: number;
  name: string;
  jobName: string;
  status: string;
};
type FieldMap = { sourceColumn: string; targetColumn: string; skipped?: boolean };
type TableMap = { sourceTable: string; targetTable: string; fields: FieldMap[] };
type Plan = PlanSummary & {
  sourceTables: Table[];
  targetTables: Table[];
  mappings: TableMap[];
  mappingInput: { tables: Array<{ table: string; source: Table | null; target: Table | null }> };
};
async function api<T>(path: string, init?: RequestInit) {
  const options: RequestInit = { ...init };
  if (init?.body) {
    const headers = new Headers(init.headers);
    headers.set("content-type", "application/json");
    options.headers = headers;
  }
  const response = await fetch(`${base}${path}`, options);
  const body = (await response.json()) as { data?: T; message?: string };
  if (!response.ok || body.data === undefined)
    throw new Error(body.message ?? "Mapping request failed.");
  return body.data;
}
const listPlans = () => api<PlanSummary[]>("/data-bridge/mapping-plans");
const listSnapshots = () => api<Snapshot[]>("/data-bridge/discovery-snapshots");
const getPlan = (id: number) => api<Plan>(`/data-bridge/mapping-plans/${id}`);
const createPlan = (discoverySnapshotId: number) =>
  api<{ id: number }>("/data-bridge/mapping-plans", {
    method: "POST",
    body: JSON.stringify({ discoverySnapshotId })
  });
const savePlan = (id: number, input: { name: string; status: string; mappings: TableMap[] }) =>
  api<{ saved: boolean }>(`/data-bridge/mapping-plans/${id}`, {
    method: "PUT",
    body: JSON.stringify(input)
  });
const deletePlan = (id: number) =>
  api<{ deleted: boolean; id: number }>(`/data-bridge/mapping-plans/${id}`, { method: "DELETE" });
export function FieldMappingsWorkspace() {
  const client = useQueryClient();
  const [open, setOpen] = useState<number | null>(null);
  const [snapshotId, setSnapshotId] = useState("");
  const plans = useQuery({ queryKey: ["data-bridge", "mapping-plans"], queryFn: listPlans });
  const snapshots = useQuery({
    queryKey: ["data-bridge", "discovery-snapshots"],
    queryFn: listSnapshots
  });
  const create = useMutation({
    mutationFn: createPlan,
    onSuccess: async (result) => {
      await client.invalidateQueries({ queryKey: ["data-bridge", "mapping-plans"] });
      setOpen(result.id);
    },
    onError: (error) => toast.error("Could not create mapping plan", { description: error.message })
  });
  const remove = useMutation({
    mutationFn: deletePlan,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["data-bridge", "mapping-plans"] });
      toast.success("Field mapping plan deleted");
    },
    onError: (error) =>
      toast.error("Could not delete field mapping plan", { description: error.message })
  });
  if (open) return <MappingEditor id={open} onBack={() => setOpen(null)} />;
  const prepared = (snapshots.data ?? []).filter((item) => item.preparedAt);
  return (
    <WorkspacePage
      title="Field Mappings"
      description="Review field mappings created from confirmed Discovery table pairs for Source-to-Target data transfer."
    >
      <section className="hidden">
        <div className="min-w-72 flex-1">
          <p className="mb-2 text-sm font-medium">Prepared Discovery snapshot</p>
          <WorkspaceSelect
            value={snapshotId}
            onValueChange={setSnapshotId}
            placeholder="Select prepared snapshot"
            options={prepared.map((item) => ({
              label: `#${item.id} · ${item.jobName} · ${item.sourceDatabase} → ${item.targetDatabase}`,
              value: String(item.id)
            }))}
          />
        </div>
        <Button
          disabled={!snapshotId || create.isPending}
          onClick={() => create.mutate(Number(snapshotId))}
        >
          <Plus className="size-4" />
          Create mapping plan
        </Button>
      </section>
      <WorkspaceTablePanel>
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <WorkspaceTableHeaderCell>Reference</WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell>Field mapping plan</WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell>Migration job</WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell>Status</WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell className="text-right">Action</WorkspaceTableHeaderCell>
            </tr>
          </thead>
          <tbody>
            {(plans.data ?? []).map((plan) => (
              <tr className="border-b last:border-0" key={plan.id}>
                <td className="px-4 py-2.5 font-mono text-xs">FM-{plan.id}</td>
                <td className="px-4 py-2.5">
                  <button className="font-medium hover:underline" onClick={() => setOpen(plan.id)}>
                    {plan.name}
                  </button>
                </td>
                <td className="px-4 py-1.5 text-right">
                  <WorkspaceRowActions
                    title={plan.name}
                    onView={() => setOpen(plan.id)}
                    onEdit={() => setOpen(plan.id)}
                    onDelete={() => remove.mutate(plan.id)}
                    deleteLabel="Delete"
                  />
                </td>
                <td className="px-4 py-2.5">{plan.jobName}</td>
                <td className="px-4 py-2.5">
                  <WorkspaceStatusBadge
                    label={plan.status}
                    tone={plan.status === "ready" ? "success" : "warning"}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!plans.data?.length ? (
          <WorkspaceTableEmptyState>No mapping plans found.</WorkspaceTableEmptyState>
        ) : null}
      </WorkspaceTablePanel>
    </WorkspacePage>
  );
}
function MappingEditor({ id, onBack }: { id: number; onBack: () => void }) {
  const query = useQuery({
    queryKey: ["data-bridge", "mapping-plan", id],
    queryFn: () => getPlan(id)
  });
  const [name, setName] = useState("");
  const [status, setStatus] = useState("draft");
  const [mappings, setMappings] = useState<TableMap[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  useEffect(() => {
    if (!query.data) return;
    setName(query.data.name);
    setStatus(query.data.status);
    setMappings(
      query.data.mappings.length
        ? query.data.mappings
        : query.data.mappingInput.tables
            .filter((item) => item.source)
            .map((item) => ({
              sourceTable: item.source!.name,
              targetTable: item.target?.name ?? "",
              fields: item.source!.columns.map((column) => ({
                sourceColumn: column.name,
                targetColumn:
                  item.target?.columns.find((target) => target.name === column.name)?.name ?? ""
              }))
            }))
    );
  }, [query.data]);
  const save = useMutation({
    mutationFn: () => savePlan(id, { name, status, mappings }),
    onSuccess: () => toast.success("Mapping plan saved"),
    onError: (error) => toast.error("Could not save mapping plan", { description: error.message })
  });
  if (!query.data)
    return (
      <WorkspacePage title="Field Mappings" description="Loading mapping plan...">
        <div className="text-sm text-muted-foreground">
          Loading prepared Source and Target schemas...
        </div>
      </WorkspacePage>
    );
  const plan = query.data;
  function _chooseTarget(index: number, targetTable: string) {
    const target = plan.targetTables.find((table) => table.name === targetTable);
    setMappings((current) =>
      current.map((mapping, i) =>
        i === index
          ? {
              ...mapping,
              targetTable,
              fields: mapping.fields.map((field) => ({
                ...field,
                targetColumn:
                  target?.columns.find((column) => column.name === field.sourceColumn)?.name ?? ""
              }))
            }
          : mapping
      )
    );
  }
  if (selectedTable) {
    const mapping = mappings.find((item) => item.sourceTable === selectedTable);
    if (mapping) {
      const index = mappings.findIndex((item) => item.sourceTable === selectedTable);
      const source = plan.sourceTables.find((table) => table.name === mapping.sourceTable);
      const target = plan.targetTables.find((table) => table.name === mapping.targetTable);
      return (
        <FieldMappingTablePage
          mapping={mapping}
          source={source}
          target={target}
          saving={save.isPending}
          onBack={() => setSelectedTable(null)}
          onSave={() => save.mutate()}
          onTargetFieldChange={(fieldIndex, targetColumn) =>
            setMappings((current) =>
              current.map((item, itemIndex) =>
                itemIndex === index
                  ? {
                      ...item,
                      fields: item.fields.map((field, currentFieldIndex) =>
                        currentFieldIndex === fieldIndex ? { ...field, targetColumn } : field
                      )
                    }
                  : item
              )
            )
          }
          onFieldSkipChange={(fieldIndex, skipped) =>
            setMappings((current) =>
              current.map((item, itemIndex) =>
                itemIndex === index
                  ? {
                      ...item,
                      fields: item.fields.map((field, currentFieldIndex) =>
                        currentFieldIndex === fieldIndex ? { ...field, skipped } : field
                      )
                    }
                  : item
              )
            )
          }
        />
      );
    }
  }
  return (
    <WorkspacePage
      title={`${name || "Mapping plan"} · FM-${id}`}
      description="Map fields for confirmed Source-to-Target table pairs. This stage transfers data only and does not migrate schemas."
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <Button disabled={save.isPending} onClick={() => save.mutate()}>
            <Save className="size-4" />
            {save.isPending ? "Saving..." : "Save mapping plan"}
          </Button>
        </div>
      }
    >
      <section className="mb-4 grid gap-4 rounded-md border bg-card p-4 md:grid-cols-2">
        <div>
          <p className="mb-2 text-sm font-medium">Plan name</p>
          <Input value={name} onChange={(event) => setName(event.target.value)} />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Transfer readiness</p>
          <WorkspaceSelect
            value={status}
            onValueChange={setStatus}
            options={[
              { label: "Draft", value: "draft" },
              { label: "Ready for transfer", value: "ready" }
            ]}
          />
        </div>
      </section>
      <h2 className="mb-3 mt-6 text-base font-semibold">Confirmed table field mappings</h2>
      <WorkspaceTablePanel>
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <WorkspaceTableHeaderCell>Reference</WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell>Source table</WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell>Target table</WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell>Fields</WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell>Mapped</WorkspaceTableHeaderCell>
            </tr>
          </thead>
          <tbody>
            {mappings
              .filter((mapping) => mapping.targetTable)
              .map((mapping, index) => (
                <tr className="border-b last:border-0" key={mapping.sourceTable}>
                  <td className="px-4 py-2.5 font-mono text-xs">
                    FM-{id}-T{index + 1}
                  </td>
                  <td className="px-4 py-2.5">
                    <button
                      className="font-mono font-medium hover:underline"
                      onClick={() => setSelectedTable(mapping.sourceTable)}
                    >
                      {mapping.sourceTable}
                    </button>
                  </td>
                  <td className="px-4 py-2.5 font-mono">{mapping.targetTable}</td>
                  <td className="px-4 py-2.5 tabular-nums">
                    {mapping.fields.filter((field) => !field.skipped).length}
                  </td>
                  <td className="px-4 py-2.5 tabular-nums">
                    {mapping.fields.filter((field) => !field.skipped && field.targetColumn).length}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </WorkspaceTablePanel>
      <div className="hidden">
        {mappings
          .filter((mapping) => mapping.targetTable)
          .map((mapping) => {
            const index = mappings.findIndex((item) => item.sourceTable === mapping.sourceTable);
            const source = plan.sourceTables.find((table) => table.name === mapping.sourceTable);
            const target = plan.targetTables.find((table) => table.name === mapping.targetTable);
            return (
              <section className="rounded-md border bg-card" key={mapping.sourceTable}>
                <div className="grid gap-3 border-b bg-muted/30 p-4 md:grid-cols-2">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                      Source table
                    </p>
                    <Input readOnly value={mapping.sourceTable} />
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                      Target table
                    </p>
                    <Input readOnly value={mapping.targetTable} />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-sm">
                    <thead>
                      <tr>
                        <WorkspaceTableHeaderCell>Source field</WorkspaceTableHeaderCell>
                        <WorkspaceTableHeaderCell>Source type</WorkspaceTableHeaderCell>
                        <WorkspaceTableHeaderCell>Target field</WorkspaceTableHeaderCell>
                      </tr>
                    </thead>
                    <tbody>
                      {mapping.fields.map((field, fieldIndex) => (
                        <tr className="border-t" key={field.sourceColumn}>
                          <td className="px-4 py-2.5 font-mono">{field.sourceColumn}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">
                            {source?.columns.find((column) => column.name === field.sourceColumn)
                              ?.type ?? "—"}
                          </td>
                          <td className="px-4 py-2.5">
                            <WorkspaceSelect
                              value={field.targetColumn}
                              onValueChange={(value) =>
                                setMappings((current) =>
                                  current.map((item, i) =>
                                    i === index
                                      ? {
                                          ...item,
                                          fields: item.fields.map((entry, j) =>
                                            j === fieldIndex
                                              ? { ...entry, targetColumn: value }
                                              : entry
                                          )
                                        }
                                      : item
                                  )
                                )
                              }
                              placeholder="Skip / select Target field"
                              options={(target?.columns ?? []).map((column) => ({
                                label: `${column.name} · ${column.type}`,
                                value: column.name
                              }))}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
      </div>
    </WorkspacePage>
  );
}

function FieldMappingTablePage({
  mapping,
  source,
  target,
  saving,
  onBack,
  onSave,
  onTargetFieldChange,
  onFieldSkipChange
}: {
  mapping: TableMap;
  source: Table | undefined;
  target: Table | undefined;
  saving: boolean;
  onBack: () => void;
  onSave: () => void;
  onTargetFieldChange: (fieldIndex: number, targetColumn: string) => void;
  onFieldSkipChange: (fieldIndex: number, skipped: boolean) => void;
}) {
  const [fieldFilter, setFieldFilter] = useState("live");
  const visibleFields = mapping.fields
    .map((field, index) => ({ field, index }))
    .filter(
      ({ field }) =>
        fieldFilter === "all" || (fieldFilter === "skipped" ? field.skipped : !field.skipped)
    );
  return (
    <WorkspacePage
      title={`${mapping.sourceTable} → ${mapping.targetTable}`}
      description="Map fields for this table pair only. No other tables are shown on this page."
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="size-4" />
            Back to tables
          </Button>
          <Button disabled={saving} onClick={onSave}>
            <Save className="size-4" />
            {saving ? "Saving..." : "Save field mappings"}
          </Button>
        </div>
      }
    >
      <section className="mb-4 grid gap-3 rounded-md border bg-card p-4 md:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Source table</p>
          <Input readOnly value={mapping.sourceTable} />
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Target table</p>
          <Input readOnly value={mapping.targetTable} />
        </div>
      </section>
      <section className="mb-4 flex items-end justify-between gap-3 rounded-md border bg-card p-4">
        <div className="w-56">
          <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Field view</p>
          <WorkspaceSelect
            value={fieldFilter}
            onValueChange={setFieldFilter}
            options={[
              { label: "Live fields", value: "live" },
              { label: "Skipped fields", value: "skipped" },
              { label: "All fields", value: "all" }
            ]}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {visibleFields.length} of {mapping.fields.length} fields
        </p>
      </section>
      <WorkspaceTablePanel>
        <table className="w-full min-w-[720px] table-fixed border-collapse text-sm">
          <thead className="bg-muted/50">
            <tr>
              <WorkspaceTableHeaderCell className="w-20 border text-center">
                Skip
              </WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell className="border">Source field</WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell className="border">Source type</WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell className="border">Target field</WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell className="border">Target type</WorkspaceTableHeaderCell>
            </tr>
          </thead>
          <tbody>
            {visibleFields.map(({ field, index: fieldIndex }) => {
              const targetColumn = target?.columns.find(
                (column) => column.name === field.targetColumn
              );
              return (
                <tr className="h-12" key={field.sourceColumn}>
                  <td className="border px-2 py-2.5 text-center">
                    <Checkbox
                      checked={Boolean(field.skipped)}
                      aria-label={`Skip ${field.sourceColumn}`}
                      onCheckedChange={(checked) => onFieldSkipChange(fieldIndex, checked === true)}
                    />
                  </td>
                  <td className="border px-4 py-2.5 font-mono">{field.sourceColumn}</td>
                  <td className="border px-4 py-2.5 text-muted-foreground">
                    {source?.columns.find((column) => column.name === field.sourceColumn)?.type ??
                      "—"}
                  </td>
                  <td className="border px-4 py-2.5">
                    <WorkspaceLookup
                      allowTextValue={false}
                      className="[&_input]:h-9 [&_input]:font-mono [&_input]:text-xs"
                      createMode="none"
                      emptyLabel="No Target fields match this search."
                      value={field.targetColumn}
                      onValueChange={(value) => onTargetFieldChange(fieldIndex, value)}
                      placeholder="Skip / select Target field"
                      options={(target?.columns ?? []).map((column) => ({
                        label: column.name,
                        value: column.name,
                        description: column.type
                      }))}
                    />
                  </td>
                  <td className="border px-4 py-2.5 text-muted-foreground">
                    {targetColumn?.type ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </WorkspaceTablePanel>
    </WorkspacePage>
  );
}

function _TableConnectionBoard({
  mappings,
  targetTables,
  onConnect
}: {
  mappings: TableMap[];
  targetTables: Table[];
  onConnect: (index: number, target: string) => void;
}) {
  return (
    <section className="rounded-md border bg-card">
      <div className="border-b p-4">
        <h2 className="font-semibold">Table discovery and confirmation</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Drag a Target table from the left and drop it onto the matching Source table in the
          middle.
        </p>
      </div>
      <div className="grid min-h-96 gap-0 lg:grid-cols-[1fr_1.4fr_1fr]">
        <div className="border-b p-4 lg:border-b-0 lg:border-r">
          <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">
            Target tables
          </p>
          <div className="max-h-[32rem] space-y-2 overflow-y-auto pr-1">
            {targetTables.map((table) => (
              <div
                className="flex cursor-grab items-center gap-2 rounded-md border bg-background px-3 py-2 font-mono text-xs active:cursor-grabbing"
                draggable
                key={table.name}
                onDragStart={(event) => event.dataTransfer.setData("text/plain", table.name)}
              >
                <GripVertical className="size-3.5 text-muted-foreground" />
                {table.name}
              </div>
            ))}
          </div>
        </div>
        <div className="border-b p-4 lg:border-b-0 lg:border-r">
          <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">
            Confirmed connections
          </p>
          <div className="max-h-[32rem] space-y-2 overflow-y-auto pr-1">
            {mappings.map((mapping, index) => (
              <div
                className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-md border border-dashed p-2"
                key={mapping.sourceTable}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const target = event.dataTransfer.getData("text/plain");
                  if (target) onConnect(index, target);
                }}
              >
                <span className="truncate rounded bg-muted px-2 py-1.5 font-mono text-xs">
                  {mapping.targetTable || "Drop Target here"}
                </span>
                <ArrowRight className="size-4 text-muted-foreground" />
                <span className="truncate rounded bg-muted px-2 py-1.5 font-mono text-xs">
                  {mapping.sourceTable}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4">
          <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">
            Source tables
          </p>
          <div className="max-h-[32rem] space-y-2 overflow-y-auto pr-1">
            {mappings.map((mapping) => (
              <div
                className="rounded-md border bg-background px-3 py-2 font-mono text-xs"
                key={mapping.sourceTable}
              >
                {mapping.sourceTable}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
