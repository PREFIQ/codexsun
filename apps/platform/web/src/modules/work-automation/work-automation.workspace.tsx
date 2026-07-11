import { useMemo, useState } from "react";
import { ArchiveRestoreIcon, ArrowLeftIcon, BanIcon, ListTreeIcon, PencilIcon, PlusIcon, RefreshCwIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { WorkspaceDatePicker } from "@codexsun/ui/workspace/date-picker";
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { WorkspaceLookup, type WorkspaceLookupOption } from "@codexsun/ui/workspace/lookup";
import { WorkspaceMinimalEditor } from "@codexsun/ui/workspace/minimal-editor";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspacePagination } from "@codexsun/ui/workspace/pagination";
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import { WorkspaceTableEmptyState, WorkspaceTableHeaderCell, WorkspaceTablePanel, WorkspaceTableSkeletonRows } from "@codexsun/ui/workspace/table";
import { WorkspaceFormBanner, WorkspaceFormField, WorkspaceFormFooter, WorkspaceFormGrid, WorkspaceUpsertDialog } from "@codexsun/ui/workspace/upsert";
import { buildShowingLabel } from "@codexsun/ui/workspace/utils";
import { useProjectManagerMutations, useProjectManagerRecordsQuery } from "../project-manager/project-manager.hooks";
import { formFromRecord, payloadFromForm } from "../project-manager/project-manager.schema";
import type { ProjectManagerForm, ProjectManagerRecord } from "../project-manager/project-manager.types";
import { WorkAutomationMetrics, WorkAutomationWorkflow, type WorkflowView } from "./work-automation.workflow";

const issueStatusOptions = ["open", "in-progress", "needs-review", "blocked", "completed"];
const taskStatusOptions = ["open", "assigned", "in-progress", "blocked", "completed"];
const activityStatusOptions = ["open", "active", "in-progress", "completed"];
const reviewStatusOptions = ["requested", "in-review", "changes-requested", "approved"];
const issueTypeOptions = ["bug", "enhancement", "feature", "support"];
const taskTypeOptions = ["implementation", "development", "testing", "documentation"];
const activityTypeOptions = ["work", "update", "meeting", "milestone"];
const reviewTypeOptions = ["code-review", "ui-review", "qa-review", "approval"];
const priorityOptions = ["low", "medium", "high", "critical"];
const flow = ["issue", "task", "activity", "review"] as const;
type FlowKind = typeof flow[number];

export function WorkAutomationWorkspace({ initialView = "automation" }: { initialView?: WorkflowView }) {
  const workflowOnly = initialView !== "automation";
  const query = useProjectManagerRecordsQuery("issue");
  const taskQuery = useProjectManagerRecordsQuery("task");
  const activityQuery = useProjectManagerRecordsQuery("activity");
  const reviewQuery = useProjectManagerRecordsQuery("review");
  const issueMutations = useProjectManagerMutations("issue");
  const taskMutations = useProjectManagerMutations("task");
  const activityMutations = useProjectManagerMutations("activity");
  const reviewMutations = useProjectManagerMutations("review");
  const [path, setPath] = useState<ProjectManagerRecord[]>([]);
  const [editing, setEditing] = useState<ProjectManagerForm | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [saveError, setSaveError] = useState("");
  const [workflowView, setWorkflowView] = useState<WorkflowView>(initialView);
  const [createdOptions, setCreatedOptions] = useState<Record<LookupKind, WorkspaceLookupOption[]>>({ assignee: [], status: [], type: [] });
  const level = Math.min(path.length, flow.length - 1);
  const kind: FlowKind = flow[level] ?? "review";
  const nextKind: FlowKind | null = flow[level + 1] ?? null;
  const parent = path.at(-1) ?? null;
  const queries = { activity: activityQuery, issue: query, review: reviewQuery, task: taskQuery };
  const mutationSets = { activity: activityMutations, issue: issueMutations, review: reviewMutations, task: taskMutations };
  const mutations = mutationSets[kind];
  const records = parent ? (queries[kind].data ?? []).filter((record) => belongsTo(record, parent)) : query.data ?? [];
  const filtered = useMemo(() => records.filter((record) => {
    const term = search.trim().toLowerCase();
    return (statusFilter === "all" || record.status === statusFilter) && (!term || `${record.key} ${record.title} ${record.description} ${record.type} ${record.assignee} ${record.priority} ${record.status}`.toLowerCase().includes(term));
  }), [records, search, statusFilter]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const pageRecords = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const activeQuery = queries[kind];
  const parentKind: FlowKind = parent && flow.includes(parent.kind as FlowKind) ? parent.kind as FlowKind : "issue";
  const parentNumber = parent ? recordNumber(queries[parentKind].data ?? [], parent) : 0;
  const busy = mutations.create.isPending || mutations.update.isPending;

  function openNew() {
    setSaveError("");
    setEditing({
      ...formFromRecord(),
      key: nextRecordKey(kind, parent, records),
      moduleKey: "work-automation",
      referenceId: parent?.key ?? "",
      referenceType: parent?.kind ?? "",
      status: defaultStatus(kind),
      type: defaultType(kind)
    });
  }

  function save(form: ProjectManagerForm) {
    const missing = requiredFields(form, kind);
    if (missing.length) {
      setSaveError(`Complete the required fields: ${missing.join(", ")}.`);
      return;
    }
    setSaveError("");
    const action = form.id
      ? mutations.update.mutateAsync({ id: form.id, payload: payloadFromForm(form) })
      : mutations.create.mutateAsync(payloadFromForm(form));
    void action.then((record) => {
      toast.success(form.id ? `${label(kind)} updated` : `${label(kind)} created`, { description: record.title });
      setEditing(null);
    }).catch((error) => setSaveError(error instanceof Error ? error.message : "Issue could not be saved."));
  }

  function lookupOptions(kind: LookupKind) {
    const defaults = kind === "status" ? statusesFor(flow[level] ?? "issue") : kind === "type" ? typesFor(flow[level] ?? "issue") : [];
    const values = [...defaults, ...records.map((record) => record[kind]).filter(Boolean)];
    return uniqueOptions([...values.map(toOption), ...createdOptions[kind]]);
  }

  async function createLookup(kind: LookupKind, name: string) {
    const option = toOption(name);
    setCreatedOptions((current) => ({ ...current, [kind]: uniqueOptions([...current[kind], option]) }));
    return option;
  }

  return (
    <WorkspacePage
      title={workflowOnly ? "Workflow" : parent ? `${label(parent.kind)} #${parentNumber} - ${parent.title}` : "Issues"}
      description={workflowOnly ? "Metrics, schedule, and delivery-state views across all work automation records." : parent ? `Linked ${label(kind).toLowerCase()} records for this ${label(parent.kind).toLowerCase()}.` : "Select an issue to drill down through tasks, activities, and reviews."}
      technicalName={workflowOnly ? "page.workflow" : `page.work-automation.${plural(kind)}`}
      actions={workflowOnly ? <Button variant="outline" onClick={() => { void query.refetch(); void taskQuery.refetch(); void activityQuery.refetch(); void reviewQuery.refetch(); }}><RefreshCwIcon className={query.isFetching || taskQuery.isFetching || activityQuery.isFetching || reviewQuery.isFetching ? "size-4 animate-spin" : "size-4"} />Refresh</Button> : <div className="flex items-center gap-2">{parent ? <Button variant="outline" onClick={() => { setPath((current) => current.slice(0, -1)); setEditing(null); setSearch(""); setStatusFilter("all"); setPage(1); }}><ArrowLeftIcon className="size-4" />Back to {path.length === 1 ? "issues" : plural(flow[level - 1] ?? "issue")}</Button> : null}<Button disabled={activeQuery.isFetching} variant="outline" onClick={() => void activeQuery.refetch()}><RefreshCwIcon className={activeQuery.isFetching ? "size-4 animate-spin" : "size-4"} />Refresh</Button><Button onClick={openNew}><PlusIcon className="size-4" />New {kind}</Button></div>}
    >
      {workflowOnly ? <>
        <WorkAutomationMetrics records={{ activities: activityQuery.data ?? [], issues: query.data ?? [], reviews: reviewQuery.data ?? [], tasks: taskQuery.data ?? [] }} />
        <div className="mb-4 flex flex-wrap gap-2 rounded-md border bg-card p-2 shadow-sm">
          {(["timeline", "gantt", "kanban"] as WorkflowView[]).map((view) => <Button key={view} size="sm" type="button" variant={workflowView === view ? "default" : "ghost"} onClick={() => setWorkflowView(view)}>{label(view)}</Button>)}
        </div>
        <WorkAutomationWorkflow records={{ activities: activityQuery.data ?? [], issues: query.data ?? [], reviews: reviewQuery.data ?? [], tasks: taskQuery.data ?? [] }} view={workflowView === "automation" ? "timeline" : workflowView} />
      </> : <>
      <WorkspaceFilters
        className="mt-4"
        filterOptions={[{ id: "all", label: `All ${plural(kind)}` }, ...uniqueOptions(statusesFor(kind).map(toOption).concat(records.map((record) => toOption(record.status)))).map((option) => ({ id: option.value, label: option.label }))]}
        filterValue={statusFilter}
        onFilterValueChange={(value) => { setStatusFilter(value); setPage(1); }}
        onSearchValueChange={(value) => { setSearch(value); setPage(1); }}
        searchPlaceholder={`Search ${plural(kind)}`}
        searchValue={search}
      />
      <WorkspaceTablePanel className="mt-4">
        <table className="w-full min-w-[980px] text-sm">
          <thead><tr><WorkspaceTableHeaderCell>#</WorkspaceTableHeaderCell><WorkspaceTableHeaderCell>{label(kind)}</WorkspaceTableHeaderCell><WorkspaceTableHeaderCell>Type</WorkspaceTableHeaderCell><WorkspaceTableHeaderCell>{actorLabel(kind)}</WorkspaceTableHeaderCell>{usesPriority(kind) ? <WorkspaceTableHeaderCell>Priority</WorkspaceTableHeaderCell> : null}<WorkspaceTableHeaderCell>{dateLabel(kind)}</WorkspaceTableHeaderCell><WorkspaceTableHeaderCell>Status</WorkspaceTableHeaderCell><WorkspaceTableHeaderCell align="right">Action</WorkspaceTableHeaderCell></tr></thead>
          <tbody>
            {activeQuery.isLoading ? <WorkspaceTableSkeletonRows columns={usesPriority(kind) ? 8 : 7} rows={6} /> : pageRecords.map((record, index) => (
              <tr className="border-b last:border-0" key={record.id}>
                <td className="w-16 px-4 py-3 font-mono text-xs text-muted-foreground">{recordNumber(activeQuery.data ?? [], record) || index + 1 + (currentPage - 1) * rowsPerPage}</td>
                <td className="px-4 py-3"><button className="text-left font-medium hover:underline" type="button" onClick={() => { setSaveError(""); if (!nextKind) setEditing(formFromRecord(record)); else { setPath((current) => [...current, record]); setSearch(""); setStatusFilter("all"); setPage(1); } }}>{record.title}</button><div className="font-mono text-xs text-muted-foreground">{record.key}</div>{nextKind ? <div className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground"><ListTreeIcon className="size-3.5" />{childCount(queries[nextKind].data ?? [], record)} {plural(nextKind)}</div> : record.description ? <div className="mt-1 max-w-[32rem] truncate text-xs text-muted-foreground">{plainText(record.description)}</div> : null}</td>
                <td className="px-4 py-3">{label(record.type)}</td><td className="px-4 py-3">{record.assignee || "-"}</td>{usesPriority(kind) ? <td className="px-4 py-3">{label(record.priority)}</td> : null}<td className="px-4 py-3">{formatDate(record.dueDate)}</td>
                <td className="px-4 py-3"><WorkspaceStatusBadge label={record.active ? label(record.status) : "Inactive"} tone={!record.active ? "neutral" : statusTone(record.status)} /></td>
                <td className="px-4 py-3"><div className="flex justify-end"><WorkspaceRowActions title={record.title} actions={[{ id: "edit", label: "Edit", icon: <PencilIcon className="size-4" />, onSelect: () => { setSaveError(""); setEditing(formFromRecord(record)); } }, record.active ? { id: "deactivate", label: "Deactivate", icon: <BanIcon className="size-4" />, onSelect: () => mutations.deactivate.mutate(record.id) } : { id: "restore", label: "Restore", icon: <ArchiveRestoreIcon className="size-4" />, onSelect: () => mutations.restore.mutate(record.id) }, { id: "delete", label: "Delete", icon: <Trash2Icon className="size-4" />, tone: "destructive", onSelect: () => { if (window.confirm(`Delete ${record.title}?`)) mutations.delete.mutate(record.id); } }]} /></div></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!activeQuery.isLoading && !filtered.length ? <WorkspaceTableEmptyState>No {plural(kind)} found.</WorkspaceTableEmptyState> : null}
      </WorkspaceTablePanel>
      <WorkspacePagination page={currentPage} rowsPerPage={rowsPerPage} showingLabel={buildShowingLabel(currentPage, rowsPerPage, filtered.length)} singularLabel={kind} totalCount={filtered.length} totalPages={totalPages} onNextPage={() => setPage((value) => Math.min(totalPages, value + 1))} onPageChange={setPage} onPreviousPage={() => setPage((value) => Math.max(1, value - 1))} onRowsPerPageChange={(value) => { setRowsPerPage(value); setPage(1); }} />
      {editing ? <IssueDialog kind={kind} parent={parent} form={editing} error={saveError} loading={busy} options={lookupOptions} onCancel={() => setEditing(null)} onCreate={createLookup} onSave={save} /> : null}
      </>}
    </WorkspacePage>
  );
}

type LookupKind = "assignee" | "status" | "type";

function IssueDialog({ kind, parent, form: initial, error, loading, options, onCancel, onCreate, onSave }: { kind: FlowKind; parent: ProjectManagerRecord | null; form: ProjectManagerForm; error: string; loading: boolean; options: (kind: LookupKind) => WorkspaceLookupOption[]; onCancel: () => void; onCreate: (kind: LookupKind, name: string) => Promise<WorkspaceLookupOption>; onSave: (form: ProjectManagerForm) => void }) {
  const [form, setForm] = useState(initial);
  const invalid = error ? new Set(requiredFields(form, kind).map((field) => field.toLowerCase())) : new Set<string>();
  const patch = <K extends keyof ProjectManagerForm>(key: K, value: ProjectManagerForm[K]) => setForm((current) => ({ ...current, [key]: value }));
  return <WorkspaceUpsertDialog className="max-h-[90vh] overflow-y-auto sm:max-w-3xl" description={parent ? `This ${kind} belongs to ${parent.title}.` : "Capture the issue details required to start the work automation flow."} open onClose={onCancel} title={`${form.id ? "Edit" : "New"} ${kind}`}>
    <form noValidate onSubmit={(event) => { event.preventDefault(); onSave(form); }}>
      {error ? <WorkspaceFormBanner title={`${label(kind)} could not be saved`}>{error}</WorkspaceFormBanner> : null}
      <WorkspaceFormGrid columns={2}>
        <WorkspaceFormField label={`${label(kind)} ID`} required><Input aria-invalid={invalid.has("record key")} className="font-mono" readOnly value={form.key} />{invalid.has("record key") ? <span className="text-xs text-destructive">{label(kind)} ID is required.</span> : null}</WorkspaceFormField>
        <WorkspaceFormField label="Title" required><Input aria-invalid={invalid.has("title")} value={form.title} onChange={(event) => patch("title", event.target.value)} />{invalid.has("title") ? <span className="text-xs text-destructive">Title is required.</span> : null}</WorkspaceFormField>
        <IssueLookup kind="type" label={`${label(kind)} type`} required form={form} options={options} onCreate={onCreate} onChange={patch} />
        <IssueLookup kind="status" label="Status" required form={form} options={options} onCreate={onCreate} onChange={patch} />
        {usesPriority(kind) ? <WorkspaceFormField label="Priority" required><WorkspaceLookup allowTextValue={false} options={priorityOptions.map(toOption)} placeholder="Select priority" value={form.priority} onValueChange={(value) => patch("priority", value as ProjectManagerForm["priority"])} /></WorkspaceFormField> : null}
        <IssueLookup kind="assignee" label={actorLabel(kind)} required={kind === "task" || kind === "review"} form={form} options={options} onCreate={onCreate} onChange={patch} />
        <WorkspaceFormField label={dateLabel(kind)}><WorkspaceDatePicker value={form.dueDate} onValueChange={(value) => patch("dueDate", value)} /></WorkspaceFormField>
        <WorkspaceFormField className="md:col-span-2" label={detailsLabel(kind)}><WorkspaceMinimalEditor content={form.description} onChange={(value) => patch("description", value)} /></WorkspaceFormField>
      </WorkspaceFormGrid>
      <WorkspaceFormFooter className="mt-6 border-t pt-4" onCancel={onCancel} primaryLabel={form.id ? "Update" : "Save"} primaryLoading={loading} />
    </form>
  </WorkspaceUpsertDialog>;
}

function IssueLookup({ kind, label: fieldLabel, required = false, form, options, onCreate, onChange }: { kind: LookupKind; label: string; required?: boolean; form: ProjectManagerForm; options: (kind: LookupKind) => WorkspaceLookupOption[]; onCreate: (kind: LookupKind, name: string) => Promise<WorkspaceLookupOption>; onChange: <K extends keyof ProjectManagerForm>(key: K, value: ProjectManagerForm[K]) => void }) {
  return <WorkspaceFormField label={fieldLabel} required={required}><WorkspaceLookup allowTextValue={false} createLabel={`Add ${fieldLabel}`} createMode="inline" emptyLabel={`No ${fieldLabel.toLowerCase()} found. Type a name to add it.`} options={options(kind)} placeholder={`Search or add ${fieldLabel.toLowerCase()}`} value={form[kind]} onCreate={(name) => onCreate(kind, name)} onValueChange={(value, option) => onChange(kind, kind === "assignee" ? (option?.label ?? value) : value)} /></WorkspaceFormField>;
}

function requiredFields(form: ProjectManagerForm, kind: FlowKind): string[] {
  const fields: Array<[string, string]> = [["Record key", form.key], ["Title", form.title], ["Type", form.type], ["Status", form.status]];
  if (usesPriority(kind)) fields.push(["Priority", form.priority]);
  if (kind === "task" || kind === "review") fields.push([actorLabel(kind), form.assignee]);
  return fields.filter(([, value]) => !value.trim()).map(([name]) => name);
}
function belongsTo(record: ProjectManagerRecord, parent: ProjectManagerRecord) { return record.referenceType === parent.kind && (record.referenceId === parent.id || record.referenceId === parent.key); }
function childCount(children: ProjectManagerRecord[], parent: ProjectManagerRecord) { return children.filter((record) => belongsTo(record, parent)).length; }
function recordNumber(records: ProjectManagerRecord[], record: ProjectManagerRecord) { const index = records.findIndex((item) => item.id === record.id); return index >= 0 ? index + 1 : 0; }
function statusesFor(kind: FlowKind) { return kind === "issue" ? issueStatusOptions : kind === "task" ? taskStatusOptions : kind === "activity" ? activityStatusOptions : reviewStatusOptions; }
function typesFor(kind: FlowKind) { return kind === "issue" ? issueTypeOptions : kind === "task" ? taskTypeOptions : kind === "activity" ? activityTypeOptions : reviewTypeOptions; }
function defaultStatus(kind: FlowKind) { return statusesFor(kind)[0] ?? "open"; }
function defaultType(kind: FlowKind) { return typesFor(kind)[0] ?? kind; }
function plural(kind: FlowKind) { return kind === "activity" ? "activities" : `${kind}s`; }
function usesPriority(kind: FlowKind) { return kind === "issue" || kind === "task"; }
function actorLabel(kind: FlowKind) { return kind === "issue" ? "Owner" : kind === "task" ? "Assignee" : kind === "activity" ? "Performed by" : "Reviewer"; }
function dateLabel(kind: FlowKind) { return kind === "activity" ? "Activity date" : kind === "review" ? "Review due date" : kind === "issue" ? "Target date" : "Due date"; }
function detailsLabel(kind: FlowKind) { return kind === "activity" ? "Work update" : kind === "review" ? "Review notes and feedback" : kind === "task" ? "Execution details" : "Problem description and acceptance outcome"; }
function nextRecordKey(kind: FlowKind, parent: ProjectManagerRecord | null, records: ProjectManagerRecord[]) {
  const prefix = kind === "issue" ? "ISS" : kind === "task" ? "TSK" : kind === "activity" ? "ACT" : "REV";
  const used = new Set(records.map((record) => record.key.toLowerCase()));
  let number = records.length + 1;
  let key = "";
  do {
    const sequence = String(number).padStart(4, "0");
    key = parent ? `${parent.key}-${prefix}-${sequence}` : `${prefix}-${sequence}`;
    number += 1;
  } while (used.has(key.toLowerCase()));
  return key;
}
function toOption(value: string): WorkspaceLookupOption { return { label: label(value), value }; }
function uniqueOptions(options: WorkspaceLookupOption[]) { return [...new Map(options.filter((option) => option.value).map((option) => [option.value.toLowerCase(), option])).values()]; }
function label(value: string) { return value.split("-").filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" "); }
function plainText(value: string) { return value.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim(); }
function statusTone(status: string): "danger" | "info" | "success" | "warning" { return status === "completed" ? "success" : status === "blocked" ? "danger" : status === "in-progress" || status === "needs-review" ? "info" : "warning"; }
function formatDate(value: string) { if (!value) return "-"; const date = new Date(`${value}T00:00:00`); return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(date); }
