import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCw, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Switch } from "@codexsun/ui/components/switch";
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import { WorkspaceTableEmptyState, WorkspaceTableHeaderCell, WorkspaceTablePanel, WorkspaceTableSkeletonRows } from "@codexsun/ui/workspace/table";
import { WorkspaceFormBanner, WorkspaceFormField, WorkspaceFormFooter, WorkspaceFormGrid, WorkspaceUpsertDialog } from "@codexsun/ui/workspace/upsert";
import { cn } from "@codexsun/ui/lib/utils";
import { createCommonMaster, listCommonMaster, setCommonMasterActive, updateCommonMaster } from "./common-master.services";
import type { CommonMasterDefinition, CommonMasterRecord, CommonMasterValue } from "./common-master.types";

export function CommonMasterWorkspace({ definition }: { definition: CommonMasterDefinition }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [editing, setEditing] = useState<CommonMasterRecord | null | undefined>(undefined);
  const query = useQuery({ queryFn: () => listCommonMaster(definition.path), queryKey: ["core", "common", definition.key] });
  const save = useMutation({
    mutationFn: (payload: Record<string, CommonMasterValue>) => editing
      ? updateCommonMaster(definition.path, editing.id, payload)
      : createCommonMaster(definition.path, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["core", "common", definition.key] });
      toast.success(`${singular(definition.label)} saved`);
      setEditing(undefined);
    }
  });
  const toggle = useMutation({
    mutationFn: (record: CommonMasterRecord) => setCommonMasterActive(definition.path, record.id, !record.isActive),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["core", "common", definition.key] })
  });
  const rows = useMemo(() => (query.data ?? []).filter((record) => {
    const matchesStatus = status === "all" || (status === "active" ? record.isActive : !record.isActive);
    const term = search.trim().toLowerCase();
    return matchesStatus && (!term || definition.fields.some((field) => String(record[field.key] ?? "").toLowerCase().includes(term)));
  }), [definition.fields, query.data, search, status]);

  return (
    <WorkspacePage
      title={definition.label}
      description={`Manage ${definition.label.toLowerCase()} for this tenant workspace.`}
      technicalName={`page.common.${definition.group}.${definition.key}.list`}
      actions={<div className="flex gap-2">
        <Button className="h-9 rounded-md" variant="outline" onClick={() => void query.refetch()}><RefreshCw className={cn("size-4", query.isFetching && "animate-spin")} />Refresh</Button>
        <Button className="h-9 rounded-md" onClick={() => setEditing(null)}><Plus className="size-4" />New {singular(definition.label).toLowerCase()}</Button>
      </div>}
    >
      <WorkspaceFilters
        filterOptions={[{ id: "all", label: "All records" }, { id: "active", label: "Active" }, { id: "inactive", label: "Inactive" }]}
        filterValue={status}
        onFilterValueChange={setStatus}
        onSearchValueChange={setSearch}
        searchPlaceholder={`Search ${definition.label.toLowerCase()}`}
        searchValue={search}
      />
      <CommonMasterList definition={definition} loading={query.isFetching && !query.data} records={rows} onEdit={setEditing} onToggle={(record) => toggle.mutate(record)} />
      <CommonMasterForm
        key={`${definition.key}:${editing?.id ?? "new"}:${editing !== undefined}`}
        definition={definition}
        error={save.error instanceof Error ? save.error.message : ""}
        loading={save.isPending}
        open={editing !== undefined}
        record={editing ?? null}
        onClose={() => setEditing(undefined)}
        onSubmit={(payload) => save.mutate(payload)}
      />
    </WorkspacePage>
  );
}

export function CommonMasterList({ definition, loading, onEdit, onToggle, records }: {
  definition: CommonMasterDefinition; loading: boolean; onEdit: (record: CommonMasterRecord) => void;
  onToggle: (record: CommonMasterRecord) => void; records: CommonMasterRecord[];
}) {
  return <WorkspaceTablePanel><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-sm">
    <thead className="bg-muted/50"><tr><WorkspaceTableHeaderCell>#</WorkspaceTableHeaderCell>
      {definition.fields.map((field) => <WorkspaceTableHeaderCell key={field.key}>{field.label}</WorkspaceTableHeaderCell>)}
      <WorkspaceTableHeaderCell>Status</WorkspaceTableHeaderCell><WorkspaceTableHeaderCell className="text-right">Action</WorkspaceTableHeaderCell>
    </tr></thead>
    <tbody>{records.map((record, index) => <tr className="border-b border-border/70 last:border-0" key={record.id}>
      <td className="px-4 py-2.5 text-muted-foreground">{index + 1}</td>
      {definition.fields.map((field) => <td className="px-4 py-2.5" key={field.key}>{formatValue(record[field.key] ?? null, field.type)}</td>)}
      <td className="px-4 py-2.5"><WorkspaceStatusBadge label={record.isActive ? "active" : "inactive"} tone={record.isActive ? "success" : "neutral"} /></td>
      <td className="px-4 py-1.5 text-right">{record.tenantId === "global" ? <span className="text-xs text-muted-foreground">Shared</span> :
        <WorkspaceRowActions title={String(record[definition.fields[0]?.key ?? "id"])} isSuspended={!record.isActive} onEdit={() => onEdit(record)} onDelete={() => onToggle(record)} onRestore={() => onToggle(record)} deleteLabel="Deactivate" restoreLabel="Activate" />}</td>
    </tr>)}</tbody>
  </table></div>
  {loading ? <WorkspaceTableSkeletonRows columns={definition.fields.length + 3} /> : null}
  {!loading && records.length === 0 ? <WorkspaceTableEmptyState>No records found.</WorkspaceTableEmptyState> : null}
  </WorkspaceTablePanel>;
}

export function CommonMasterForm({ definition, error, loading, onClose, onSubmit, open, record }: {
  definition: CommonMasterDefinition; error: string; loading: boolean; onClose: () => void;
  onSubmit: (payload: Record<string, CommonMasterValue>) => void; open: boolean; record: CommonMasterRecord | null;
}) {
  const initial = Object.fromEntries(definition.fields.map((field) => [field.key, record?.[field.key] ?? defaultValue(field.type)]));
  const [value, setValue] = useState<Record<string, CommonMasterValue>>({ ...initial, isActive: record?.isActive ?? true, sortOrder: 1000 });
  return <WorkspaceUpsertDialog className="max-h-[90vh] overflow-y-auto sm:max-w-xl" description={`Enter the ${singular(definition.label).toLowerCase()} details.`} open={open} onClose={onClose} title={`${record ? "Edit" : "New"} ${singular(definition.label).toLowerCase()}`}>
    <form key={`${definition.key}:${record?.id ?? "new"}:${open}`} onSubmit={(event) => { event.preventDefault(); onSubmit(value); }}>
      {error ? <WorkspaceFormBanner title="Unable to save">{error}</WorkspaceFormBanner> : null}
      <WorkspaceFormGrid columns={1}>
        {definition.fields.map((field) => <WorkspaceFormField key={field.key} label={field.label} {...(field.required ? { required: true } : {})}>
          {field.type === "boolean" ? <Switch checked={Boolean(value[field.key])} onCheckedChange={(checked) => setValue((current) => ({ ...current, [field.key]: checked }))} /> :
            <Input required={field.required} type={field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "color" ? "color" : "text"} value={String(value[field.key] ?? "")} onChange={(event) => setValue((current) => ({ ...current, [field.key]: field.type === "number" ? Number(event.target.value) : event.target.value }))} />}
        </WorkspaceFormField>)}
        <WorkspaceFormField label="Sort order"><Input min={0} type="number" value={String(value.sortOrder ?? 1000)} onChange={(event) => setValue((current) => ({ ...current, sortOrder: Number(event.target.value) }))} /></WorkspaceFormField>
        <WorkspaceFormField label="Active"><div className="flex h-11 items-center gap-3 rounded-md border px-3"><Switch checked={Boolean(value.isActive)} onCheckedChange={(checked) => setValue((current) => ({ ...current, isActive: checked }))} /><span className="text-sm text-muted-foreground">{value.isActive ? "Available" : "Inactive"}</span></div></WorkspaceFormField>
      </WorkspaceFormGrid>
      <WorkspaceFormFooter className="mt-6 border-t pt-4" onCancel={onClose} primaryLabel="Save" primaryLoading={loading} primaryProps={{ children: <><Save className="size-4" />Save</> }} />
    </form>
  </WorkspaceUpsertDialog>;
}

function formatValue(value: CommonMasterValue, type: string) {
  if (type === "boolean") return value ? "Yes" : "No";
  if (type === "color") return <span className="inline-flex items-center gap-2"><span className="size-4 rounded-sm border" style={{ backgroundColor: String(value) }} />{String(value ?? "-")}</span>;
  return String(value ?? "-");
}
function defaultValue(type: string): CommonMasterValue { return type === "boolean" ? false : type === "number" ? 0 : ""; }
function singular(label: string) { return label.endsWith("ies") ? `${label.slice(0, -3)}y` : label.endsWith("s") ? label.slice(0, -1) : label; }
