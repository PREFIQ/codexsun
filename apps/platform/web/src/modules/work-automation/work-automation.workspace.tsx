import { useMemo, useState } from "react";
import { ArchiveRestoreIcon, BanIcon, PencilIcon, PlusIcon, RefreshCwIcon, Trash2Icon } from "lucide-react";
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

const statusOptions = ["open", "in-progress", "needs-review", "blocked", "completed"];
const typeOptions = ["bug", "enhancement", "feature", "support"];
const priorityOptions = ["low", "medium", "high", "critical"];

export function WorkAutomationWorkspace() {
  const query = useProjectManagerRecordsQuery("issue");
  const mutations = useProjectManagerMutations("issue");
  const [editing, setEditing] = useState<ProjectManagerForm | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [saveError, setSaveError] = useState("");
  const [createdOptions, setCreatedOptions] = useState<Record<LookupKind, WorkspaceLookupOption[]>>({ assignee: [], status: [], type: [] });
  const records = query.data ?? [];
  const filtered = useMemo(() => records.filter((record) => {
    const term = search.trim().toLowerCase();
    return (statusFilter === "all" || record.status === statusFilter) && (!term || `${record.key} ${record.title} ${record.description} ${record.type} ${record.assignee} ${record.priority} ${record.status}`.toLowerCase().includes(term));
  }), [records, search, statusFilter]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const pageRecords = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const busy = mutations.create.isPending || mutations.update.isPending;

  function openNew() {
    setSaveError("");
    setEditing({ ...formFromRecord(), moduleKey: "work-automation", status: "open", type: "bug" });
  }

  function save(form: ProjectManagerForm) {
    const missing = requiredFields(form);
    if (missing.length) {
      setSaveError(`Complete the required fields: ${missing.join(", ")}.`);
      return;
    }
    setSaveError("");
    const action = form.id
      ? mutations.update.mutateAsync({ id: form.id, payload: payloadFromForm(form) })
      : mutations.create.mutateAsync(payloadFromForm(form));
    void action.then((record) => {
      toast.success(form.id ? "Issue updated" : "Issue created", { description: record.title });
      setEditing(null);
    }).catch((error) => setSaveError(error instanceof Error ? error.message : "Issue could not be saved."));
  }

  function lookupOptions(kind: LookupKind) {
    const defaults = kind === "status" ? statusOptions : kind === "type" ? typeOptions : [];
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
      title="Issues"
      description="Create and review work automation issues with ownership, priority, status, and due dates."
      technicalName="page.work-automation.issues"
      actions={<div className="flex items-center gap-2"><Button disabled={query.isFetching} variant="outline" onClick={() => void query.refetch()}><RefreshCwIcon className={query.isFetching ? "size-4 animate-spin" : "size-4"} />Refresh</Button><Button onClick={openNew}><PlusIcon className="size-4" />New issue</Button></div>}
    >
      <WorkspaceFilters
        className="mt-4"
        filterOptions={[{ id: "all", label: "All issues" }, ...uniqueOptions(statusOptions.map(toOption).concat(records.map((record) => toOption(record.status)))).map((option) => ({ id: option.value, label: option.label }))]}
        filterValue={statusFilter}
        onFilterValueChange={(value) => { setStatusFilter(value); setPage(1); }}
        onSearchValueChange={(value) => { setSearch(value); setPage(1); }}
        searchPlaceholder="Search issues"
        searchValue={search}
      />
      <WorkspaceTablePanel className="mt-4">
        <table className="w-full min-w-[980px] text-sm">
          <thead><tr><WorkspaceTableHeaderCell>Issue</WorkspaceTableHeaderCell><WorkspaceTableHeaderCell>Type</WorkspaceTableHeaderCell><WorkspaceTableHeaderCell>Assignee</WorkspaceTableHeaderCell><WorkspaceTableHeaderCell>Priority</WorkspaceTableHeaderCell><WorkspaceTableHeaderCell>Due date</WorkspaceTableHeaderCell><WorkspaceTableHeaderCell>Status</WorkspaceTableHeaderCell><WorkspaceTableHeaderCell align="right">Action</WorkspaceTableHeaderCell></tr></thead>
          <tbody>
            {query.isLoading ? <WorkspaceTableSkeletonRows columns={7} rows={6} /> : pageRecords.map((record) => (
              <tr className="border-b last:border-0" key={record.id}>
                <td className="px-4 py-3"><button className="text-left font-medium hover:underline" type="button" onClick={() => { setSaveError(""); setEditing(formFromRecord(record)); }}>{record.title}</button><div className="font-mono text-xs text-muted-foreground">{record.key}</div>{record.description ? <div className="mt-1 max-w-[32rem] truncate text-xs text-muted-foreground">{plainText(record.description)}</div> : null}</td>
                <td className="px-4 py-3">{label(record.type)}</td><td className="px-4 py-3">{record.assignee || "-"}</td><td className="px-4 py-3">{label(record.priority)}</td><td className="px-4 py-3">{formatDate(record.dueDate)}</td>
                <td className="px-4 py-3"><WorkspaceStatusBadge label={record.active ? label(record.status) : "Inactive"} tone={!record.active ? "neutral" : statusTone(record.status)} /></td>
                <td className="px-4 py-3"><div className="flex justify-end"><WorkspaceRowActions title={record.title} actions={[{ id: "edit", label: "Edit", icon: <PencilIcon className="size-4" />, onSelect: () => { setSaveError(""); setEditing(formFromRecord(record)); } }, record.active ? { id: "deactivate", label: "Deactivate", icon: <BanIcon className="size-4" />, onSelect: () => mutations.deactivate.mutate(record.id) } : { id: "restore", label: "Restore", icon: <ArchiveRestoreIcon className="size-4" />, onSelect: () => mutations.restore.mutate(record.id) }, { id: "delete", label: "Delete", icon: <Trash2Icon className="size-4" />, tone: "destructive", onSelect: () => { if (window.confirm(`Delete ${record.title}?`)) mutations.delete.mutate(record.id); } }]} /></div></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!query.isLoading && !filtered.length ? <WorkspaceTableEmptyState>No issues found.</WorkspaceTableEmptyState> : null}
      </WorkspaceTablePanel>
      <WorkspacePagination page={currentPage} rowsPerPage={rowsPerPage} showingLabel={buildShowingLabel(currentPage, rowsPerPage, filtered.length)} singularLabel="issue" totalCount={filtered.length} totalPages={totalPages} onNextPage={() => setPage((value) => Math.min(totalPages, value + 1))} onPageChange={setPage} onPreviousPage={() => setPage((value) => Math.max(1, value - 1))} onRowsPerPageChange={(value) => { setRowsPerPage(value); setPage(1); }} />
      {editing ? <IssueDialog form={editing} error={saveError} loading={busy} options={lookupOptions} onCancel={() => setEditing(null)} onCreate={createLookup} onSave={save} /> : null}
    </WorkspacePage>
  );
}

type LookupKind = "assignee" | "status" | "type";

function IssueDialog({ form: initial, error, loading, options, onCancel, onCreate, onSave }: { form: ProjectManagerForm; error: string; loading: boolean; options: (kind: LookupKind) => WorkspaceLookupOption[]; onCancel: () => void; onCreate: (kind: LookupKind, name: string) => Promise<WorkspaceLookupOption>; onSave: (form: ProjectManagerForm) => void }) {
  const [form, setForm] = useState(initial);
  const invalid = error ? new Set(requiredFields(form).map((field) => field.toLowerCase())) : new Set<string>();
  const patch = <K extends keyof ProjectManagerForm>(key: K, value: ProjectManagerForm[K]) => setForm((current) => ({ ...current, [key]: value }));
  return <WorkspaceUpsertDialog className="max-h-[90vh] overflow-y-auto sm:max-w-3xl" description="Capture the issue details required to start the work automation flow." open onClose={onCancel} title={`${form.id ? "Edit" : "New"} issue`}>
    <form noValidate onSubmit={(event) => { event.preventDefault(); onSave(form); }}>
      {error ? <WorkspaceFormBanner title="Issue could not be saved">{error}</WorkspaceFormBanner> : null}
      <WorkspaceFormGrid columns={2}>
        <WorkspaceFormField label="Issue key" required><Input aria-invalid={invalid.has("issue key")} value={form.key} onChange={(event) => patch("key", event.target.value)} />{invalid.has("issue key") ? <span className="text-xs text-destructive">Issue key is required.</span> : null}</WorkspaceFormField>
        <WorkspaceFormField label="Title" required><Input aria-invalid={invalid.has("title")} value={form.title} onChange={(event) => patch("title", event.target.value)} />{invalid.has("title") ? <span className="text-xs text-destructive">Title is required.</span> : null}</WorkspaceFormField>
        <IssueLookup kind="type" label="Type" required form={form} options={options} onCreate={onCreate} onChange={patch} />
        <IssueLookup kind="status" label="Status" required form={form} options={options} onCreate={onCreate} onChange={patch} />
        <WorkspaceFormField label="Priority" required><WorkspaceLookup allowTextValue={false} options={priorityOptions.map(toOption)} placeholder="Select priority" value={form.priority} onValueChange={(value) => patch("priority", value as ProjectManagerForm["priority"])} /></WorkspaceFormField>
        <IssueLookup kind="assignee" label="Assignee" form={form} options={options} onCreate={onCreate} onChange={patch} />
        <WorkspaceFormField label="Due date"><WorkspaceDatePicker value={form.dueDate} onValueChange={(value) => patch("dueDate", value)} /></WorkspaceFormField>
        <WorkspaceFormField className="md:col-span-2" label="Description"><WorkspaceMinimalEditor content={form.description} onChange={(value) => patch("description", value)} /></WorkspaceFormField>
      </WorkspaceFormGrid>
      <WorkspaceFormFooter className="mt-6 border-t pt-4" onCancel={onCancel} primaryLabel={form.id ? "Update" : "Save"} primaryLoading={loading} />
    </form>
  </WorkspaceUpsertDialog>;
}

function IssueLookup({ kind, label: fieldLabel, required = false, form, options, onCreate, onChange }: { kind: LookupKind; label: string; required?: boolean; form: ProjectManagerForm; options: (kind: LookupKind) => WorkspaceLookupOption[]; onCreate: (kind: LookupKind, name: string) => Promise<WorkspaceLookupOption>; onChange: <K extends keyof ProjectManagerForm>(key: K, value: ProjectManagerForm[K]) => void }) {
  return <WorkspaceFormField label={fieldLabel} required={required}><WorkspaceLookup allowTextValue={false} createLabel={`Add ${fieldLabel}`} createMode="inline" emptyLabel={`No ${fieldLabel.toLowerCase()} found. Type a name to add it.`} options={options(kind)} placeholder={`Search or add ${fieldLabel.toLowerCase()}`} value={form[kind]} onCreate={(name) => onCreate(kind, name)} onValueChange={(value, option) => onChange(kind, kind === "assignee" ? (option?.label ?? value) : value)} /></WorkspaceFormField>;
}

function requiredFields(form: ProjectManagerForm): string[] { return [["Issue key", form.key], ["Title", form.title], ["Type", form.type], ["Status", form.status], ["Priority", form.priority]].filter(([, value]) => !String(value).trim()).map(([name]) => String(name)); }
function toOption(value: string): WorkspaceLookupOption { return { label: label(value), value }; }
function uniqueOptions(options: WorkspaceLookupOption[]) { return [...new Map(options.filter((option) => option.value).map((option) => [option.value.toLowerCase(), option])).values()]; }
function label(value: string) { return value.split("-").filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" "); }
function plainText(value: string) { return value.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim(); }
function statusTone(status: string): "danger" | "info" | "success" | "warning" { return status === "completed" ? "success" : status === "blocked" ? "danger" : status === "in-progress" || status === "needs-review" ? "info" : "warning"; }
function formatDate(value: string) { if (!value) return "-"; const date = new Date(`${value}T00:00:00`); return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(date); }
