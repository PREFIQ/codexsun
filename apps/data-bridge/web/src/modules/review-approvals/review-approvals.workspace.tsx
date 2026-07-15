import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import {
  useReviewActions,
  useReviewApprovals,
  useReviewCandidates
} from "./review-approvals.hooks";
import { ReviewDecisionForm, ReviewPrepareForm } from "./review-approvals.form";
import { ReviewApprovalsList } from "./review-approvals.list";
import type { ReviewApproval } from "./review-approvals.types";
export function ReviewApprovalsWorkspace() {
  const reviews = useReviewApprovals();
  const candidates = useReviewCandidates();
  const actions = useReviewActions();
  const [selected, setSelected] = useState<ReviewApproval | null>(null);
  const notify = (promise: Promise<ReviewApproval>, message: string) =>
    promise
      .then((record) => {
        setSelected(record);
        toast.success(message);
      })
      .catch((error: Error) => toast.error(message, { description: error.message }));
  if (selected)
    return (
      <WorkspacePage
        title={`${selected.planName} · RV-${selected.id}`}
        description="Immutable dry-run evidence, separation-of-duties decision, and execution eligibility."
        actions={
          <Button variant="outline" onClick={() => setSelected(null)}>
            <ArrowLeft className="size-4" />
            Back
          </Button>
        }
      >
        <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
          <section className="space-y-3">
            <div className="grid gap-3 rounded-md border bg-card p-4 sm:grid-cols-4">
              <Metric
                label="Status"
                value={
                  <WorkspaceStatusBadge
                    label={selected.status}
                    tone={
                      selected.status === "approved"
                        ? "success"
                        : selected.status === "pending"
                          ? "warning"
                          : "danger"
                    }
                  />
                }
              />
              <Metric label="Source rows" value={selected.totalSourceRows} />
              <Metric label="Target rows" value={selected.totalTargetRows} />
              <Metric label="Checksum" value={selected.checksum.slice(0, 12)} />
            </div>
            {selected.tables.map((table) => (
              <div key={table.targetTable} className="rounded-md border bg-card p-4">
                <div className="flex items-center justify-between">
                  <p className="font-mono font-semibold">
                    {table.sourceTable} → {table.targetTable}
                  </p>
                  <WorkspaceStatusBadge
                    label={table.blockingRisks.length ? "blocked" : "ready"}
                    tone={table.blockingRisks.length ? "danger" : "success"}
                  />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {table.sourceCount} source · {table.targetCount} target · identity:{" "}
                  {table.identityFields.join(", ") || "missing"}
                </p>
                {[...table.blockingRisks, ...table.warnings].map((message) => (
                  <p key={message} className="mt-2 text-sm text-destructive">
                    {message}
                  </p>
                ))}
              </div>
            ))}
          </section>
          <ReviewDecisionForm
            review={selected}
            pending={
              actions.approve.isPending || actions.reject.isPending || actions.revoke.isPending
            }
            error={(actions.approve.error ?? actions.reject.error ?? actions.revoke.error)?.message}
            onApprove={(input) =>
              notify(actions.approve.mutateAsync({ id: selected.id, input }), "Review approved")
            }
            onReject={(input) =>
              notify(actions.reject.mutateAsync({ id: selected.id, input }), "Review rejected")
            }
            onRevoke={(input) =>
              notify(actions.revoke.mutateAsync({ id: selected.id, input }), "Approval revoked")
            }
          />
        </div>
      </WorkspacePage>
    );
  return (
    <WorkspacePage
      title="Review & Approvals"
      description="Run read-only evidence checks, lock the query checksum, and record an independent approval before any Target write."
    >
      <div className="space-y-4">
        <ReviewPrepareForm
          candidates={candidates.data ?? []}
          pending={actions.prepare.isPending}
          error={actions.prepare.error?.message}
          onSubmit={(input) => notify(actions.prepare.mutateAsync(input), "Review prepared")}
        />
        <ReviewApprovalsList
          records={reviews.data ?? []}
          loading={reviews.isLoading}
          onView={setSelected}
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
