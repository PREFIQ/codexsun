import { useMemo, useState } from "react";
import { AlertTriangleIcon, CheckCircle2Icon, GitBranchIcon, ListChecksIcon, PlusIcon, RefreshCwIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspaceSelect } from "@codexsun/ui/workspace/select";
import { ProjectManagerFormPanel } from "../project-manager/project-manager.form";
import { useProjectManagerMutations, useProjectManagerRecordsQuery, useProjectManagerResultQuery } from "../project-manager/project-manager.hooks";
import { ProjectManagerList } from "../project-manager/project-manager.list";
import { formFromRecord, payloadFromForm, validateProjectManagerForm } from "../project-manager/project-manager.schema";
import type { ProjectManagerForm, ProjectManagerKind, ProjectManagerRecord } from "../project-manager/project-manager.types";

const flow: ProjectManagerKind[] = ["issue", "task", "review", "kanban", "todo", "timeline", "activity", "discussion", "release"];
const labels: Record<ProjectManagerKind, string> = {
  activity: "Activity",
  discussion: "Discussions",
  issue: "Issues",
  kanban: "Kanban",
  release: "Releases",
  review: "Reviews",
  task: "Tasks",
  timeline: "Timeline",
  todo: "Todos"
};

export function WorkAutomationWorkspace() {
  const [kind, setKind] = useState<ProjectManagerKind>("issue");
  const [path, setPath] = useState<ProjectManagerRecord[]>([]);
  const [form, setForm] = useState<ProjectManagerForm | null>(null);
  const [saveError, setSaveError] = useState("");
  const resultQuery = useProjectManagerResultQuery();
  const recordsQuery = useProjectManagerRecordsQuery(kind);
  const mutations = useProjectManagerMutations(kind);
  const busy = recordsQuery.isFetching || mutations.create.isPending || mutations.update.isPending;
  const parent = path.at(-1);
  const records = useMemo(() => filteredRecords(recordsQuery.data ?? [], parent), [parent, recordsQuery.data]);
  const openRecords = useMemo(() => records.filter((record) => record.active && !["completed", "done", "released", "approved"].includes(record.status)), [records]);

  function switchKind(nextKind: ProjectManagerKind) {
    setKind(nextKind);
    setForm(null);
    setPath([]);
  }

  function drill(record: ProjectManagerRecord) {
    const nextKind = nextKindFor(kind);
    if (!nextKind) return;
    setPath((current) => [...current, record]);
    setKind(nextKind);
    setForm(null);
  }

  function backTo(index: number) {
    const nextPath = path.slice(0, index + 1);
    const selected = nextPath[index];
    if (!selected) return;
    setPath(nextPath);
    setKind(nextKindFor(selected.kind) ?? "issue");
  }

  function newForm() {
    const next = formFromRecord();
    setForm({
      ...next,
      moduleKey: "work-automation",
      referenceId: parent?.key ?? "",
      referenceType: parent?.kind ?? "",
      status: defaultStatus(kind),
      type: kind
    });
  }

  function save() {
    if (!form) return;
    const error = validateProjectManagerForm(form);
    if (error) {
      setSaveError(error);
      return;
    }
    setSaveError("");
    const payload = payloadFromForm(form);
    const action = form.id ? mutations.update.mutateAsync({ id: form.id, payload }) : mutations.create.mutateAsync(payload);
    action
      .then((record) => {
        toast.success("Work automation saved", { description: record.title });
        setForm(null);
      })
      .catch((errorValue) => setSaveError(errorValue instanceof Error ? errorValue.message : "Save failed."));
  }

  return (
    <WorkspacePage
      title="Work Automation"
      description="Issue, task, review, kanban, todo, timeline, activity, discussion, and release flow."
      technicalName="page.work-automation"
      actions={
        <div className="flex flex-wrap justify-end gap-2">
          <div className="w-44"><WorkspaceSelect value={kind} options={flow.map((item) => ({ label: labels[item], value: item }))} onValueChange={(value) => switchKind(value as ProjectManagerKind)} /></div>
          <Button disabled={busy} variant="outline" onClick={() => { void resultQuery.refetch(); void recordsQuery.refetch(); }}><RefreshCwIcon className="size-4" />Refresh</Button>
          <Button disabled={busy} onClick={newForm}><PlusIcon className="size-4" />New</Button>
        </div>
      }
    >
      <div className="mb-4 grid gap-4 md:grid-cols-4">
        <Metric icon={ListChecksIcon} label="All work records" value={String(resultQuery.data?.summary.total ?? 0)} />
        <Metric icon={CheckCircle2Icon} label="Active" value={String(resultQuery.data?.summary.active ?? 0)} />
        <Metric icon={AlertTriangleIcon} label="Risk" value={String(resultQuery.data?.summary.blocked ?? 0)} />
        <Metric icon={GitBranchIcon} label={`${labels[kind]} open`} value={String(openRecords.length)} />
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-md border bg-card px-4 py-3 text-sm shadow-sm">
        <Button size="sm" variant={path.length ? "outline" : "default"} onClick={() => switchKind("issue")}>Issues</Button>
        {path.map((record, index) => <Button key={record.id} size="sm" variant="outline" onClick={() => backTo(index)}>{record.title}</Button>)}
        <span className="text-muted-foreground">/ {labels[kind]}</span>
      </div>
      {parent ? <div className="mb-4 rounded-md border bg-card px-4 py-3 text-sm shadow-sm"><span className="font-medium">Filtered by:</span> {parent.title} <span className="font-mono text-xs text-muted-foreground">({parent.key})</span></div> : null}
      {form ? <div className="mb-4"><ProjectManagerFormPanel error={saveError} form={form} loading={busy} onCancel={() => setForm(null)} onChange={setForm} onSubmit={save} /></div> : null}
      {nextKindFor(kind) ? (
        <ProjectManagerList
          records={records}
          onDeactivate={(record) => mutations.deactivate.mutate(record.id)}
          onDelete={(record) => {
            if (window.confirm(`Delete ${record.title}?`)) mutations.delete.mutate(record.id);
          }}
          onDrill={drill}
          onEdit={(record) => setForm(formFromRecord(record))}
          onRestore={(record) => mutations.restore.mutate(record.id)}
        />
      ) : (
        <ProjectManagerList
          records={records}
          onDeactivate={(record) => mutations.deactivate.mutate(record.id)}
          onDelete={(record) => {
            if (window.confirm(`Delete ${record.title}?`)) mutations.delete.mutate(record.id);
          }}
          onEdit={(record) => setForm(formFromRecord(record))}
          onRestore={(record) => mutations.restore.mutate(record.id)}
        />
      )}
    </WorkspacePage>
  );
}

function filteredRecords(records: ProjectManagerRecord[], parent?: ProjectManagerRecord) {
  if (!parent) return records;
  const keys = new Set([parent.id, parent.key]);
  const filtered = records.filter((record) => keys.has(record.referenceId) || record.referenceType === parent.kind);
  return filtered.length ? filtered : records;
}

function nextKindFor(kind: ProjectManagerKind) {
  const index = flow.indexOf(kind);
  return index >= 0 ? flow[index + 1] : undefined;
}

function defaultStatus(kind: ProjectManagerKind) {
  if (kind === "issue" || kind === "discussion" || kind === "todo") return "open";
  if (kind === "review") return "requested";
  if (kind === "release") return "planned";
  return "active";
}

function Metric({ icon: Icon, label, value }: { icon: typeof ListChecksIcon; label: string; value: string }) {
  return <div className="rounded-md border bg-card p-4 shadow-sm"><div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">{label}<Icon className="size-4" /></div><div className="mt-2 text-2xl font-semibold">{value}</div></div>;
}
