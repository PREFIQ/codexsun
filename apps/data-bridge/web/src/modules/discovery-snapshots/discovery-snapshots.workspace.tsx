import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Play, RefreshCw, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { Checkbox } from "@codexsun/ui/components/checkbox";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import {
  WorkspaceTableEmptyState,
  WorkspaceTableHeaderCell,
  WorkspaceTablePanel,
  WorkspaceTableLoadingState
} from "@codexsun/ui/workspace/table";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import { WorkspaceShowCard, WorkspaceDetailTable } from "@codexsun/ui/workspace/show";
import { WorkspaceSelect } from "@codexsun/ui/workspace/select";
import { WorkspaceLookup } from "@codexsun/ui/workspace/lookup";
import { WorkspacePagination } from "@codexsun/ui/workspace/pagination";
import { buildShowingLabel } from "@codexsun/ui/workspace/utils";
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions";
import { listMigrationJobs } from "../migration-manager/migration-manager.services";

const base = import.meta.env.VITE_DATA_BRIDGE_API_URL ?? "http://127.0.0.1:7090";
type Summary = {
  id: number;
  migrationJobId: number;
  jobName: string;
  sourceDatabase: string;
  targetDatabase: string;
  sourceTableCount: number;
  targetTableCount: number;
  differenceCount: number;
  createdAt: string;
};
type Difference = {
  table: string;
  status: "match" | "missing-target" | "target-only" | "different";
  differences: string[];
};
type SchemaTable = { name: string; type: string; estimatedRows: number; columns: unknown[] };
type Snapshot = Summary & {
  comparison: Difference[];
  source: SchemaTable[];
  target: SchemaTable[];
  omittedTables: string[];
  tableMappings: Record<string, string>;
  tableGroups: Record<string, string>;
  mappingInput: unknown | null;
  preparedAt: string | null;
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
    throw new Error(body.message ?? "Discovery request failed.");
  return body.data;
}

function SingleRowTableMapper({
  snapshot,
  disabled,
  onSkip,
  onMap
}: {
  snapshot: Snapshot;
  disabled: boolean;
  onSkip: (table: string, checked: boolean) => void;
  onMap: (target: string, source: string) => void;
}) {
  const targets = snapshot.target
    .filter((table) => !snapshot.omittedTables.includes(table.name))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <WorkspaceTablePanel className="min-w-0">
      <div className="max-h-[36rem] w-full overflow-auto">
        <table className="w-full min-w-[900px] table-fixed border-collapse text-sm">
          <colgroup>
            <col className="w-[6%]" />
            <col className="w-[35%]" />
            <col className="w-[47%]" />
            <col className="w-[12%]" />
          </colgroup>
          <thead className="sticky top-0 z-20 bg-muted/95 backdrop-blur">
            <tr>
              <WorkspaceTableHeaderCell className="border-r text-center">
                Skip
              </WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell className="border-r">
                {`Target — ${snapshot.targetDatabase}`}
              </WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell className="border-r">
                {`Source — ${snapshot.sourceDatabase}`}
              </WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell className="text-center">Status</WorkspaceTableHeaderCell>
            </tr>
          </thead>
          <tbody>
            {targets.map((target) => {
              const sourceName = sourceForTarget(snapshot.tableMappings, target.name);
              return (
                <tr className="border-b last:border-0" key={target.name}>
                  <td className="border-r px-2 py-2 text-center align-middle">
                    <Checkbox
                      disabled={disabled}
                      checked={false}
                      aria-label={`Skip ${target.name}`}
                      onCheckedChange={(checked) => onSkip(target.name, checked === true)}
                    />
                  </td>
                  <td className="border-r px-3 py-2 align-middle font-mono text-xs font-medium">
                    {target.name}
                  </td>
                  <td className="border-r px-2 py-1.5 align-middle">
                    <WorkspaceLookup
                      key={`${target.name}-${sourceName}`}
                      className="[&_input]:h-9 [&_input]:font-mono [&_input]:text-xs"
                      createMode="none"
                      disabled={disabled}
                      emptyLabel="No Source table found."
                      options={snapshot.source.map((table) => ({
                        label: table.name,
                        value: table.name
                      }))}
                      placeholder="Select Source table"
                      value={sourceName}
                      onValueChange={(value, option) => {
                        if (!value || option) onMap(target.name, value);
                      }}
                    />
                  </td>
                  <td className="px-2 py-2 text-center align-middle">
                    <WorkspaceStatusBadge
                      label={sourceName ? "mapped" : "unmapped"}
                      tone={sourceName ? "success" : "warning"}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!targets.length ? (
        <WorkspaceTableEmptyState>No target tables available for mapping.</WorkspaceTableEmptyState>
      ) : null}
    </WorkspaceTablePanel>
  );
}

function _UngroupedSplitTableMapper({
  snapshot,
  disabled,
  onSkip,
  onMap,
  onGroup
}: {
  snapshot: Snapshot;
  disabled: boolean;
  onSkip: (table: string, checked: boolean) => void;
  onMap: (target: string, source: string) => void;
  onGroup: (target: string, group: string) => Promise<void>;
}) {
  const targets = snapshot.target.filter((table) => !snapshot.omittedTables.includes(table.name));
  const mappedSources = new Set(Object.keys(snapshot.tableMappings));
  const targetSections = splitByMapped(targets, (table) =>
    Boolean(sourceForTarget(snapshot.tableMappings, table.name))
  );
  const sourceSections = splitByMapped(snapshot.source, (table) => mappedSources.has(table.name));
  const knownGroups = Array.from(
    new Set([
      "Sales",
      "Purchase",
      "Accounts",
      "Inventory",
      "Contacts",
      "Products",
      ...Object.values(snapshot.tableGroups)
    ])
  )
    .filter(Boolean)
    .map((value) => ({ label: value, value }));
  return (
    <div className="grid overflow-hidden rounded-md border bg-card lg:grid-cols-[1.45fr_1fr]">
      <section className="min-w-0 border-b lg:border-b-0 lg:border-r">
        <div className="grid grid-cols-[3rem_9rem_minmax(11rem,0.8fr)_minmax(17rem,1.2fr)_6rem] border-b bg-muted/50 text-xs font-semibold uppercase text-muted-foreground">
          <div className="border-r px-2 py-3 text-center">Skip</div>
          <div className="border-r px-3 py-3">Group</div>
          <div className="border-r px-3 py-3">{`Target — ${snapshot.targetDatabase}`}</div>
          <div className="border-r px-3 py-3">Source mapping</div>
          <div className="px-2 py-3 text-center">Attach</div>
        </div>
        <div className="h-[36rem] overflow-y-auto [scrollbar-color:hsl(var(--muted-foreground)/0.35)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/35 [&::-webkit-scrollbar-track]:bg-transparent">
          {targetSections.map((section) => (
            <div
              className={
                section.label === "To discover" ? "mt-6 border-t-8 border-background pt-2" : ""
              }
              key={section.label}
            >
              <div className="sticky top-0 z-20 border-y bg-primary/10 px-3 py-2 text-xs font-bold uppercase text-primary">
                {section.label}
              </div>
              {section.tables
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((target) => {
                  const sourceName = sourceForTarget(snapshot.tableMappings, target.name);
                  const group = snapshot.tableGroups[target.name] ?? "";
                  return (
                    <div
                      className="grid min-h-12 grid-cols-[3rem_9rem_minmax(11rem,0.8fr)_minmax(17rem,1.2fr)_6rem] border-b text-sm"
                      key={target.name}
                    >
                      <div className="flex items-center justify-center border-r">
                        <Checkbox
                          disabled={disabled}
                          checked={false}
                          aria-label={`Skip ${target.name}`}
                          onCheckedChange={(checked) => onSkip(target.name, checked === true)}
                        />
                      </div>
                      <div className="border-r px-1.5 py-1.5">
                        <TableGroupLookup
                          disabled={disabled}
                          options={knownGroups}
                          value={group}
                          onSave={(value) => onGroup(target.name, value)}
                        />
                      </div>
                      <div className="flex items-center border-r px-3 font-mono text-xs">
                        {target.name}
                      </div>
                      <div className="border-r px-2 py-1.5">
                        <WorkspaceLookup
                          key={`${target.name}-${sourceName}`}
                          className="[&_input]:h-9 [&_input]:font-mono [&_input]:text-xs"
                          createMode="none"
                          emptyLabel="No Source table found."
                          options={snapshot.source.map((table) => ({
                            label: table.name,
                            value: table.name
                          }))}
                          placeholder="Select Source table"
                          value={sourceName}
                          onValueChange={(value, option) => {
                            if (!value || option) onMap(target.name, value);
                          }}
                        />
                      </div>
                      <div
                        className="p-2"
                        onDragOver={(event) => {
                          event.preventDefault();
                          event.dataTransfer.dropEffect = "copy";
                        }}
                        onDrop={(event) => {
                          event.preventDefault();
                          const source = event.dataTransfer.getData("text/plain").trim();
                          if (source) onMap(target.name, source);
                        }}
                      >
                        <div
                          className={`flex h-full min-h-8 items-center justify-center rounded-md border border-dashed text-[11px] font-semibold ${sourceName ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-primary/40 text-muted-foreground"}`}
                        >
                          {sourceName ? "Attached" : "Drop"}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </section>
      <section className="min-w-0">
        <div className="grid grid-cols-[1fr_7rem] border-b bg-muted/50 text-xs font-semibold uppercase text-muted-foreground">
          <div className="border-r px-3 py-3">{`Source — ${snapshot.sourceDatabase}`}</div>
          <div className="px-2 py-3 text-center">Status</div>
        </div>
        <div className="h-[36rem] overflow-y-auto [scrollbar-color:hsl(var(--muted-foreground)/0.35)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/35 [&::-webkit-scrollbar-track]:bg-transparent">
          {sourceSections.map((section) => (
            <div
              className={
                section.label === "To discover" ? "mt-6 border-t-8 border-background pt-2" : ""
              }
              key={section.label}
            >
              <div className="sticky top-0 z-20 border-y bg-primary/10 px-3 py-2 text-xs font-bold uppercase text-primary">
                {section.label === "To discover" ? "Available" : section.label}
              </div>
              {section.tables
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((source) => {
                  const target = snapshot.tableMappings[source.name] ?? "";
                  return (
                    <div
                      className="grid min-h-12 cursor-grab grid-cols-[1fr_7rem] border-b text-sm active:cursor-grabbing"
                      draggable
                      key={source.name}
                      onDragStart={(event) => {
                        event.dataTransfer.effectAllowed = "copy";
                        event.dataTransfer.setData("text/plain", source.name);
                      }}
                    >
                      <div className="flex items-center border-r px-3 font-mono text-xs">
                        {source.name}
                      </div>
                      <div className="flex items-center justify-center px-2">
                        <WorkspaceStatusBadge
                          label={target ? "mapped" : "available"}
                          tone={target ? "success" : "neutral"}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function TableGroupLookup({
  disabled,
  options,
  value,
  onSave
}: {
  disabled: boolean;
  options: Array<{ label: string; value: string }>;
  value: string;
  onSave: (value: string) => Promise<void>;
}) {
  const [localValue, setLocalValue] = useState(value);
  useEffect(() => setLocalValue(value), [value]);
  async function save(next: string) {
    setLocalValue(next);
    await onSave(next);
  }
  const mergedOptions = Array.from(
    new Map(
      [...(localValue ? [{ label: localValue, value: localValue }] : []), ...options].map(
        (option) => [option.value, option]
      )
    ).values()
  );
  return (
    <WorkspaceLookup
      allowTextValue
      className="[&_input]:h-9 [&_input]:text-xs"
      createLabel="Use group"
      createMode="inline"
      disabled={disabled}
      emptyLabel="Type a group name."
      options={mergedOptions}
      placeholder="Group"
      value={localValue}
      onCreate={async (name) => {
        await save(name);
        return { label: name, value: name };
      }}
      onValueChange={(next, option) => {
        if (!next || option) void save(next);
      }}
    />
  );
}

function _SplitTableMapper({
  snapshot,
  disabled,
  onSkip,
  onMap,
  onGroup: _onGroup
}: {
  snapshot: Snapshot;
  disabled: boolean;
  onSkip: (table: string, checked: boolean) => void;
  onMap: (target: string, source: string) => void;
  onGroup: (target: string, group: string) => void;
}) {
  const targets = snapshot.target.filter((table) => !snapshot.omittedTables.includes(table.name));
  const mappedSources = new Set(Object.keys(snapshot.tableMappings));
  const targetSections = splitByMapped(targets, (table) =>
    Boolean(sourceForTarget(snapshot.tableMappings, table.name))
  );
  const sourceSections = splitByMapped(snapshot.source, (table) => mappedSources.has(table.name));
  return (
    <div className="grid overflow-hidden rounded-md border bg-card lg:grid-cols-[1.35fr_1fr]">
      <section className="min-w-0 border-b lg:border-b-0 lg:border-r">
        <div className="grid grid-cols-[3rem_minmax(11rem,0.8fr)_minmax(17rem,1.2fr)_6rem] border-b bg-muted/50 text-xs font-semibold uppercase text-muted-foreground">
          <div className="border-r px-2 py-3 text-center">Skip</div>
          <div className="border-r px-3 py-3">{`Target — ${snapshot.targetDatabase}`}</div>
          <div className="border-r px-3 py-3">Source mapping</div>
          <div className="px-2 py-3 text-center">Attach</div>
        </div>
        <div className="h-[36rem] overflow-y-auto">
          {targetSections.map((section) => (
            <TableSection
              key={section.label}
              label={section.label}
              groups={groupTables(section.tables)}
              render={(target) => {
                const sourceName = sourceForTarget(snapshot.tableMappings, target.name);
                return (
                  <div
                    className="grid min-h-12 grid-cols-[3rem_minmax(11rem,0.8fr)_minmax(17rem,1.2fr)_6rem] border-b text-sm"
                    key={target.name}
                  >
                    <div className="flex items-center justify-center border-r">
                      <Checkbox
                        disabled={disabled}
                        checked={false}
                        aria-label={`Skip ${target.name}`}
                        onCheckedChange={(checked) => onSkip(target.name, checked === true)}
                      />
                    </div>
                    <div className="flex items-center border-r px-3 font-mono text-xs">
                      {target.name}
                    </div>
                    <div className="border-r px-2 py-1.5">
                      <WorkspaceLookup
                        key={`${target.name}-${sourceName}`}
                        className="[&_input]:h-9 [&_input]:font-mono [&_input]:text-xs"
                        createMode="none"
                        emptyLabel="No Source table found."
                        options={snapshot.source.map((table) => ({
                          label: table.name,
                          value: table.name,
                          description: tableGroup(table.name)
                        }))}
                        placeholder="Select Source table"
                        value={sourceName}
                        onValueChange={(value, option) => {
                          if (!value || option) onMap(target.name, value);
                        }}
                      />
                    </div>
                    <div
                      className="p-2"
                      onDragOver={(event) => {
                        event.preventDefault();
                        event.dataTransfer.dropEffect = "copy";
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        const source = event.dataTransfer.getData("text/plain").trim();
                        if (source) onMap(target.name, source);
                      }}
                    >
                      <div
                        className={`flex h-full min-h-8 items-center justify-center rounded-md border border-dashed text-[11px] font-semibold ${sourceName ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-primary/40 text-muted-foreground"}`}
                      >
                        {sourceName ? "Attached" : "Drop"}
                      </div>
                    </div>
                  </div>
                );
              }}
            />
          ))}
        </div>
      </section>
      <section className="min-w-0">
        <div className="grid grid-cols-[1fr_7rem] border-b bg-muted/50 text-xs font-semibold uppercase text-muted-foreground">
          <div className="border-r px-3 py-3">{`Source — ${snapshot.sourceDatabase}`}</div>
          <div className="px-2 py-3 text-center">Status</div>
        </div>
        <div className="h-[36rem] overflow-y-auto">
          {sourceSections.map((section) => (
            <div
              className={
                section.label === "To discover" ? "mt-6 border-t-8 border-background pt-2" : ""
              }
              key={section.label}
            >
              <div className="sticky top-0 z-20 border-y bg-primary/10 px-3 py-2 text-xs font-bold uppercase text-primary">
                {section.label === "To discover" ? "Available" : section.label}
              </div>
              {section.tables
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((source) => {
                  const targetName = snapshot.tableMappings[source.name] ?? "";
                  return (
                    <div
                      className="grid min-h-12 cursor-grab grid-cols-[1fr_7rem] border-b text-sm active:cursor-grabbing"
                      draggable
                      key={source.name}
                      onDragStart={(event) => {
                        event.dataTransfer.effectAllowed = "copy";
                        event.dataTransfer.setData("text/plain", source.name);
                      }}
                    >
                      <div className="flex items-center border-r px-3 font-mono text-xs">
                        {source.name}
                      </div>
                      <div className="flex items-center justify-center px-2">
                        <WorkspaceStatusBadge
                          label={targetName ? "mapped" : "available"}
                          tone={targetName ? "success" : "neutral"}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function TableSection({
  label,
  groups,
  render
}: {
  label: string;
  groups: Array<{ name: string; tables: SchemaTable[] }>;
  render: (table: SchemaTable) => ReactNode;
}) {
  return (
    <div className={label === "To discover" ? "mt-6 border-t-8 border-background pt-2" : ""}>
      <div className="sticky top-0 z-20 border-y bg-primary/10 px-3 py-2 text-xs font-bold uppercase text-primary">
        {label}
      </div>
      {groups.map((group) => (
        <div key={group.name}>
          <div className="sticky top-8 z-10 border-b bg-muted px-3 py-1.5 text-[11px] font-semibold uppercase text-muted-foreground">
            {group.name}
          </div>
          {group.tables.map(render)}
        </div>
      ))}
    </div>
  );
}

function splitByMapped(tables: SchemaTable[], mapped: (table: SchemaTable) => boolean) {
  return [
    { label: "Mapped", tables: tables.filter(mapped) },
    { label: "To discover", tables: tables.filter((table) => !mapped(table)) }
  ].filter((section) => section.tables.length);
}
function groupTables(tables: SchemaTable[]) {
  const groups = new Map<string, SchemaTable[]>();
  for (const table of tables) {
    const group = tableGroup(table.name);
    groups.set(group, [...(groups.get(group) ?? []), table]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, items]) => ({ name, tables: items.sort((a, b) => a.name.localeCompare(b.name)) }));
}
function tableGroup(name: string) {
  const root = name.replace(
    /(?:_activities|_allocations|_comments|_items|_lines|_entries|_details|_compliances|_payments|_receipts|_settings|_logs|_links)$/,
    ""
  );
  const first = root.split("_")[0] ?? root;
  const labels: Record<string, string> = {
    sale: "Sales",
    sales: "Sales",
    export: "Export Sales",
    purchase: "Purchase",
    purchases: "Purchase",
    payment: "Payments",
    receipt: "Receipts",
    account: "Accounts",
    billing: "Billing",
    contact: "Contacts",
    customer: "Customers",
    product: "Products",
    stock: "Inventory",
    inventory: "Inventory"
  };
  return labels[first] ?? first.replace(/\b\w/g, (letter) => letter.toUpperCase());
}
function sourceForTarget(mappings: Record<string, string>, target: string) {
  return Object.entries(mappings).find(([, value]) => value === target)?.[0] ?? "";
}
const list = () => api<Summary[]>("/data-bridge/discovery-snapshots");
const get = (id: number) => api<Snapshot>(`/data-bridge/discovery-snapshots/${id}`);
const run = (migrationJobId: number) =>
  api<Snapshot>("/data-bridge/discovery-snapshots", {
    method: "POST",
    body: JSON.stringify({ migrationJobId })
  });
const deleteSnapshot = (id: number) =>
  api<{ deleted: boolean }>(`/data-bridge/discovery-snapshots/${id}`, { method: "DELETE" });
const saveOmitted = (id: number, tables: string[]) =>
  api<Snapshot>(`/data-bridge/discovery-snapshots/${id}/omitted-tables`, {
    method: "PATCH",
    body: JSON.stringify({ tables })
  });
const saveTableMappings = (id: number, mappings: Record<string, string>) =>
  api<Snapshot>(`/data-bridge/discovery-snapshots/${id}/table-mappings`, {
    method: "PATCH",
    body: JSON.stringify({ mappings })
  });
const saveTableGroups = (id: number, groups: Record<string, string>) =>
  api<Snapshot>(`/data-bridge/discovery-snapshots/${id}/table-groups`, {
    method: "PATCH",
    body: JSON.stringify({ groups })
  });
const prepareMappings = (id: number) =>
  api<Snapshot>(`/data-bridge/discovery-snapshots/${id}/prepare-mappings`, { method: "POST" });

export function DiscoverySnapshotsWorkspace() {
  const client = useQueryClient();
  const [jobId, setJobId] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const snapshots = useQuery({ queryKey: ["data-bridge", "discovery-snapshots"], queryFn: list });
  const jobs = useQuery({
    queryKey: ["data-bridge", "migration-jobs"],
    queryFn: listMigrationJobs
  });
  const discovery = useMutation({
    mutationFn: run,
    onSuccess: async (snapshot) => {
      await client.invalidateQueries({ queryKey: ["data-bridge", "discovery-snapshots"] });
      toast.success("Discovery completed");
      setSelected(snapshot.id);
    },
    onError: (error) => toast.error("Discovery failed", { description: error.message })
  });
  const remove = useMutation({
    mutationFn: deleteSnapshot,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["data-bridge", "discovery-snapshots"] });
      toast.success("Discovery snapshot deleted");
    },
    onError: (error) => toast.error("Could not delete snapshot", { description: error.message })
  });
  const detail = useQuery({
    queryKey: ["data-bridge", "discovery-snapshots", selected],
    queryFn: () => get(selected!),
    enabled: selected !== null
  });
  if (selected !== null && detail.data)
    return <SnapshotShow snapshot={detail.data} onBack={() => setSelected(null)} />;
  return (
    <WorkspacePage
      title="Discovery Snapshots"
      description="Read source and target metadata, then compare every table and column without changing either database."
      actions={
        <Button variant="outline" onClick={() => void snapshots.refetch()}>
          <RefreshCw className="size-4" />
          Refresh
        </Button>
      }
    >
      <section className="mb-4 flex flex-wrap items-end gap-3 rounded-md border bg-card p-4">
        <div className="min-w-72 flex-1">
          <p className="mb-2 text-sm font-medium">Migration job</p>
          <WorkspaceSelect
            value={jobId}
            onValueChange={setJobId}
            placeholder="Select migration job"
            options={(jobs.data ?? []).map((job) => ({ label: job.name, value: String(job.id) }))}
          />
        </div>
        <Button
          disabled={!jobId || discovery.isPending}
          onClick={() => discovery.mutate(Number(jobId))}
        >
          <Play className="size-4" />
          {discovery.isPending ? "Discovering..." : "Run read-only discovery"}
        </Button>
      </section>
      <WorkspaceTablePanel className="min-w-0">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-muted/50">
              <tr>
                <WorkspaceTableHeaderCell>Reference</WorkspaceTableHeaderCell>
                <WorkspaceTableHeaderCell>Migration job</WorkspaceTableHeaderCell>
                <WorkspaceTableHeaderCell>Source tables</WorkspaceTableHeaderCell>
                <WorkspaceTableHeaderCell>Target tables</WorkspaceTableHeaderCell>
                <WorkspaceTableHeaderCell>Differences</WorkspaceTableHeaderCell>
                <WorkspaceTableHeaderCell>Created</WorkspaceTableHeaderCell>
                <WorkspaceTableHeaderCell className="text-right">Action</WorkspaceTableHeaderCell>
              </tr>
            </thead>
            <tbody>
              {(snapshots.data ?? []).map((item) => (
                <tr className="border-b last:border-0" key={item.id}>
                  <td className="px-4 py-2.5">
                    <button
                      className="font-medium hover:underline"
                      onClick={() => setSelected(item.id)}
                    >
                      DS-{item.id}
                    </button>
                  </td>
                  <td className="px-4 py-2.5">{item.jobName}</td>
                  <td className="px-4 py-2.5">{item.sourceTableCount}</td>
                  <td className="px-4 py-2.5">{item.targetTableCount}</td>
                  <td className="px-4 py-2.5">
                    <WorkspaceStatusBadge
                      label={String(item.differenceCount)}
                      tone={item.differenceCount ? "warning" : "success"}
                    />
                  </td>
                  <td className="px-4 py-2.5">{new Date(item.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-1.5 text-right">
                    <WorkspaceRowActions
                      title={`Discovery snapshot #${item.id}`}
                      onView={() => setSelected(item.id)}
                      onEdit={() => setSelected(item.id)}
                      onDelete={() => remove.mutate(item.id)}
                      deleteLabel="Delete"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!snapshots.data?.length && snapshots.isFetching ? <WorkspaceTableLoadingState /> : null}
        {!snapshots.data?.length && !snapshots.isFetching ? (
          <WorkspaceTableEmptyState>No discovery snapshots yet.</WorkspaceTableEmptyState>
        ) : null}
      </WorkspaceTablePanel>
    </WorkspacePage>
  );
}
function SnapshotShow({ snapshot: initial, onBack }: { snapshot: Snapshot; onBack: () => void }) {
  const [snapshot, setSnapshot] = useState(initial);
  const [showSkipped, setShowSkipped] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const omit = useMutation({
    mutationFn: (tables: string[]) => saveOmitted(snapshot.id, tables),
    onSuccess: setSnapshot,
    onError: (error) =>
      toast.error("Could not update skipped tables", { description: error.message })
  });
  const tableMapping = useMutation({
    mutationFn: (mappings: Record<string, string>) => saveTableMappings(snapshot.id, mappings),
    onSuccess: setSnapshot,
    onError: (error) => toast.error("Could not save table mapping", { description: error.message })
  });
  const resetComparison = useMutation({
    mutationFn: async () => {
      await saveOmitted(snapshot.id, []);
      await saveTableMappings(snapshot.id, {});
      return saveTableGroups(snapshot.id, {});
    },
    onSuccess: (result) => {
      setSnapshot(result);
      setShowSkipped(false);
      setCurrentPage(1);
      toast.success("Comparison reset", {
        description: "All tables are visible with no skips or manual mappings."
      });
    },
    onError: (error) => toast.error("Could not reset comparison", { description: error.message })
  });
  const prepare = useMutation({
    mutationFn: () => prepareMappings(snapshot.id),
    onSuccess: (result) => {
      setSnapshot(result);
      toast.success("Selected tables prepared", {
        description: "The selected tables and fields are ready in Field Mappings."
      });
    },
    onError: (error) => toast.error("Could not prepare mappings", { description: error.message })
  });

  function toggle(table: string, checked: boolean) {
    const tables = checked
      ? [...snapshot.omittedTables, table]
      : snapshot.omittedTables.filter((item) => item !== table);
    omit.mutate(tables);
    if (checked) setShowSkipped(false);
  }

  function _updateTableMapping(sourceTable: string, targetTable: string, persist = false) {
    const mappings = { ...snapshot.tableMappings };
    if (targetTable.trim()) mappings[sourceTable] = targetTable.trim();
    else delete mappings[sourceTable];
    setSnapshot((current) => ({
      ...current,
      tableMappings: mappings,
      mappingInput: null,
      preparedAt: null
    }));
    if (persist) tableMapping.mutate(mappings);
  }

  function updateTargetMapping(targetTable: string, sourceTable: string) {
    const mappings = Object.fromEntries(
      Object.entries(snapshot.tableMappings).filter(([, target]) => target !== targetTable)
    );
    if (sourceTable.trim()) mappings[sourceTable.trim()] = targetTable;
    setSnapshot((current) => ({
      ...current,
      tableMappings: mappings,
      mappingInput: null,
      preparedAt: null
    }));
    tableMapping.mutate(mappings);
  }

  const visibleTables = snapshot.target.filter(
    (table) => showSkipped || !snapshot.omittedTables.includes(table.name)
  );
  const totalPages = Math.max(1, Math.ceil(visibleTables.length / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const pageTables = visibleTables.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage);

  return (
    <WorkspacePage
      title={`Discovery DS-${snapshot.id}`}
      description={`${snapshot.jobName} · compare legacy Source data against the final Target contract`}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <Button
            variant="outline"
            disabled={resetComparison.isPending}
            onClick={() => resetComparison.mutate()}
          >
            <RefreshCw className="size-4" />
            {resetComparison.isPending ? "Resetting..." : "Reload defaults"}
          </Button>
          <Button disabled={omit.isPending || prepare.isPending} onClick={() => prepare.mutate()}>
            <Save className="size-4" />
            {prepare.isPending ? "Preparing..." : "Prepare selected tables"}
          </Button>
        </div>
      }
    >
      <div className="mb-4 grid gap-4 md:grid-cols-3">
        <WorkspaceShowCard title={`Source — ${snapshot.sourceDatabase}`}>
          <WorkspaceDetailTable rows={[["Tables", snapshot.sourceTableCount]]} />
        </WorkspaceShowCard>
        <WorkspaceShowCard title={`Target — ${snapshot.targetDatabase}`}>
          <WorkspaceDetailTable rows={[["Tables", snapshot.targetTableCount]]} />
        </WorkspaceShowCard>
        <WorkspaceShowCard title="Actionable gap">
          <WorkspaceDetailTable
            rows={[
              ["Different tables", snapshot.differenceCount],
              ["Skipped tables", snapshot.omittedTables.length],
              [
                "Mapping handoff",
                snapshot.preparedAt
                  ? `Prepared ${new Date(snapshot.preparedAt).toLocaleString()}`
                  : "Not prepared"
              ]
            ]}
          />
        </WorkspaceShowCard>
      </div>
      <SingleRowTableMapper
        snapshot={snapshot}
        disabled={omit.isPending || tableMapping.isPending}
        onSkip={toggle}
        onMap={updateTargetMapping}
      />
      <div className="hidden">
        <WorkspaceTablePanel>
          <table className="w-full min-w-[900px] table-fixed border-collapse text-sm">
            <colgroup>
              <col className="w-[5%]" />
              <col className="w-[22%]" />
              <col className="w-[30%]" />
              <col className="w-[8%]" />
              <col className="w-[25%]" />
              <col className="w-[10%]" />
            </colgroup>
            <thead className="bg-muted/50">
              <tr>
                <WorkspaceTableHeaderCell className="border px-2 text-center">
                  Skip
                </WorkspaceTableHeaderCell>
                <WorkspaceTableHeaderCell className="border">{`Target Table — ${snapshot.targetDatabase}`}</WorkspaceTableHeaderCell>
                <WorkspaceTableHeaderCell className="border text-center">
                  Mapping
                </WorkspaceTableHeaderCell>
                <WorkspaceTableHeaderCell className="border text-center">
                  Drop & Attach
                </WorkspaceTableHeaderCell>
                <WorkspaceTableHeaderCell className="border">{`Source Table — ${snapshot.sourceDatabase}`}</WorkspaceTableHeaderCell>
                <WorkspaceTableHeaderCell className="border px-2">Status</WorkspaceTableHeaderCell>
              </tr>
            </thead>
            <tbody>
              {pageTables.map((item) => {
                const targetName = item.name;
                const sourceName =
                  Object.entries(snapshot.tableMappings).find(
                    ([, target]) => target === targetName
                  )?.[0] ?? "";
                const skipped = snapshot.omittedTables.includes(targetName);
                const mappedName = sourceName;
                return (
                  <tr className="h-12" key={targetName}>
                    <td className="border px-2 py-3 text-center align-middle">
                      <Checkbox
                        checked={skipped}
                        disabled={omit.isPending}
                        aria-label={`Skip ${targetName}`}
                        onCheckedChange={(checked) => toggle(targetName, checked === true)}
                      />
                    </td>
                    <td
                      className="cursor-grab border px-4 py-3 align-middle font-mono font-medium active:cursor-grabbing"
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.effectAllowed = "copy";
                        event.dataTransfer.setData("text/plain", targetName);
                      }}
                    >
                      {targetName}
                    </td>
                    <td className="border bg-muted/10 px-3 py-2 align-middle">
                      <WorkspaceLookup
                        key={`${targetName}-${mappedName}`}
                        allowTextValue
                        className="[&_input]:h-8 [&_input]:font-mono [&_input]:text-xs"
                        createMode="none"
                        emptyLabel="No Source table matches this name."
                        options={snapshot.source.map((table) => ({
                          label: table.name,
                          value: table.name
                        }))}
                        placeholder="Search, type, or paste Source table"
                        value={mappedName}
                        onValueChange={(value, option) => {
                          if (!value || option) updateTargetMapping(targetName, value);
                        }}
                      />
                    </td>
                    <td
                      className="border bg-muted/20 px-2 py-2 align-middle"
                      onDragEnter={(event) => event.preventDefault()}
                      onDragOverCapture={(event) => {
                        event.preventDefault();
                        event.dataTransfer.dropEffect = "copy";
                      }}
                      onDropCapture={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        const tableName = event.dataTransfer.getData("text/plain").trim();
                        if (tableName) updateTargetMapping(targetName, tableName);
                      }}
                    >
                      <div
                        className={`flex h-8 items-center justify-center rounded-md border border-dashed text-[11px] font-semibold ${mappedName ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-primary/40 bg-background text-muted-foreground"}`}
                      >
                        {mappedName ? "Attached" : "Drop Source"}
                      </div>
                    </td>
                    <td
                      className="cursor-grab border px-4 py-3 align-middle font-mono font-medium active:cursor-grabbing"
                      draggable={Boolean(sourceName)}
                      onDragStart={(event) => {
                        if (!sourceName) return;
                        event.dataTransfer.effectAllowed = "copy";
                        event.dataTransfer.setData("text/plain", sourceName);
                      }}
                    >
                      {sourceName || "—"}
                    </td>
                    <td className="border px-2 py-3 align-middle">
                      <WorkspaceStatusBadge
                        label={skipped ? "skipped" : mappedName ? "mapped" : "unmapped"}
                        tone={skipped ? "neutral" : mappedName ? "success" : "warning"}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </WorkspaceTablePanel>
        <WorkspacePagination
          page={safePage}
          rowsPerPage={rowsPerPage}
          showingLabel={buildShowingLabel(safePage, rowsPerPage, visibleTables.length)}
          singularLabel="tables"
          totalCount={visibleTables.length}
          totalPages={totalPages}
          onNextPage={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
          onPageChange={setCurrentPage}
          onPreviousPage={() => setCurrentPage((page) => Math.max(1, page - 1))}
          onRowsPerPageChange={(value) => {
            setRowsPerPage(value);
            setCurrentPage(1);
          }}
        />
      </div>
    </WorkspacePage>
  );
}
