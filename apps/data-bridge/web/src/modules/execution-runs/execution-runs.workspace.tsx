import { useEffect, useState } from "react";
import { ArrowLeft, CirclePause, CirclePlay, RotateCcw, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import { ExecutionCreateForm, ConflictDecisionForm } from "./execution-runs.form";
import {
  useExecutionActions,
  useExecutionReviewOptions,
  useExecutionRuns
} from "./execution-runs.hooks";
import { ExecutionRunsList } from "./execution-runs.list";
import type { ExecutionRun } from "./execution-runs.types";
export function ExecutionRunsWorkspace() {
  const runs = useExecutionRuns();
  const reviews = useExecutionReviewOptions();
  const actions = useExecutionActions();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = (runs.data ?? []).find((run) => run.id === selectedId) ?? null;
  useEffect(() => {
    if (selectedId && !selected) setSelectedId(null);
  }, [selected, selectedId]);
  const lifecycle = (run: ExecutionRun, action: "pause" | "resume" | "cancel" | "retry") => {
    const actor = window.prompt(`Actor recording ${action}`)?.trim();
    if (!actor) return;
    actions.lifecycle.mutate(
      { id: run.id, action, actor },
      {
        onSuccess: () => toast.success(`Execution ${action} recorded`),
        onError: (error) =>
          toast.error(`Could not ${action} execution`, { description: error.message })
      }
    );
  };
  if (selected)
    return (
      <WorkspacePage
        title={`${selected.name} · EX-${selected.id}`}
        description={`Approval ${selected.approvalReference} · checksum ${selected.checksum.slice(0, 12)}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setSelectedId(null)}>
              <ArrowLeft className="size-4" />
              Back
            </Button>
            {selected.status === "running" || selected.status === "queued" ? (
              <Button variant="outline" onClick={() => lifecycle(selected, "pause")}>
                <CirclePause className="size-4" />
                Pause
              </Button>
            ) : null}
            {selected.status === "paused" || selected.status === "blocked" ? (
              <Button variant="outline" onClick={() => lifecycle(selected, "resume")}>
                <CirclePlay className="size-4" />
                Resume
              </Button>
            ) : null}
            {selected.status === "failed" ? (
              <Button variant="outline" onClick={() => lifecycle(selected, "retry")}>
                <RotateCcw className="size-4" />
                Retry
              </Button>
            ) : null}
            {!["completed", "cancelled"].includes(selected.status) ? (
              <Button variant="destructive" onClick={() => lifecycle(selected, "cancel")}>
                <XCircle className="size-4" />
                Cancel
              </Button>
            ) : null}
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-3 rounded-md border bg-card p-4 sm:grid-cols-4">
            <Metric
              label="Status"
              value={
                <WorkspaceStatusBadge
                  label={selected.status}
                  tone={
                    selected.status === "completed"
                      ? "success"
                      : selected.status === "blocked" || selected.status === "failed"
                        ? "danger"
                        : "info"
                  }
                />
              }
            />
            <Metric label="Current table" value={selected.currentTable ?? "—"} />
            <Metric label="Batch size" value={selected.batchSize} />
            <Metric label="Conflicts" value={selected.conflicts.length} />
          </div>
          {selected.error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {selected.error}
            </p>
          ) : null}
          <div className="grid gap-3 md:grid-cols-2">
            {selected.tables.map((table) => (
              <section key={table.targetTable} className="rounded-md border bg-card p-4">
                <div className="flex justify-between">
                  <p className="font-mono font-semibold">
                    {table.sourceTable} → {table.targetTable}
                  </p>
                  <WorkspaceStatusBadge
                    label={table.status}
                    tone={
                      table.status === "completed"
                        ? "success"
                        : table.status === "blocked" || table.status === "failed"
                          ? "danger"
                          : "info"
                    }
                  />
                </div>
                <p className="mt-3 text-sm">
                  Checkpoint {table.checkpoint} / {table.totalRows}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Inserted {table.insertedRows} · Overridden {table.overriddenRows} · Rejected{" "}
                  {table.rejectedRows}
                </p>
                {table.error ? (
                  <p className="mt-2 text-sm text-destructive">{table.error}</p>
                ) : null}
              </section>
            ))}
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {selected.conflicts
              .filter((item) => item.status === "pending")
              .map((conflict) => (
                <ConflictDecisionForm
                  key={conflict.id}
                  conflict={conflict}
                  pending={actions.conflict.isPending}
                  error={actions.conflict.error?.message}
                  onSubmit={(input) =>
                    actions.conflict.mutate(
                      { id: selected.id, conflictId: conflict.id, input },
                      {
                        onSuccess: () => toast.success("Conflict decision recorded"),
                        onError: (error) =>
                          toast.error("Could not record decision", { description: error.message })
                      }
                    )
                  }
                />
              ))}
          </div>
        </div>
      </WorkspacePage>
    );
  return (
    <WorkspacePage
      title="Execution Runs"
      description="Run approved Source-to-Target transfers in resumable batches with per-record checkpoints and conflict quarantine."
    >
      <div className="space-y-4">
        <ExecutionCreateForm
          reviews={reviews.data ?? []}
          pending={actions.create.isPending}
          error={actions.create.error?.message}
          onSubmit={(input) =>
            actions.create.mutate(input, {
              onSuccess: (run) => {
                setSelectedId(run.id);
                toast.success("Execution queued");
              },
              onError: (error) =>
                toast.error("Could not queue execution", { description: error.message })
            })
          }
        />
        <ExecutionRunsList
          records={runs.data ?? []}
          loading={runs.isLoading}
          onView={(run) => setSelectedId(run.id)}
        />
      </div>
    </WorkspacePage>
  );
}
function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
}
