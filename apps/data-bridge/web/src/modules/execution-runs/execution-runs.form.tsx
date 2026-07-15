import { useState } from "react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { WorkspaceSelect } from "@codexsun/ui/workspace/select";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import { conflictDecisionSchema, createExecutionSchema } from "./execution-runs.schema";
import type {
  ConflictDecisionInput,
  CreateExecutionInput,
  ExecutionConflict,
  ExecutionReviewOption
} from "./execution-runs.types";
export function ExecutionCreateForm({
  reviews,
  pending,
  error,
  onSubmit
}: {
  reviews: ExecutionReviewOption[];
  pending: boolean;
  error: string | undefined;
  onSubmit: (input: CreateExecutionInput) => unknown;
}) {
  const [reviewId, setReviewId] = useState("");
  const [requestedBy, setRequestedBy] = useState("");
  const [batchSize, setBatchSize] = useState("100");
  const [validation, setValidation] = useState("");
  const submit = () => {
    const result = createExecutionSchema.safeParse({
      reviewId: Number(reviewId),
      requestedBy,
      batchSize: Number(batchSize)
    });
    if (!result.success)
      return setValidation(result.error.issues[0]?.message ?? "Complete the execution form.");
    setValidation("");
    onSubmit(result.data);
  };
  return (
    <section className="space-y-3 rounded-md border bg-card p-4">
      <div>
        <h3 className="font-semibold">Queue approved transfer</h3>
        <p className="text-sm text-muted-foreground">
          Execution begins in checkpointed batches and stops at the first existing Target record.
        </p>
      </div>
      {validation || error ? (
        <WorkspaceFormBanner title="Unable to queue execution">
          {validation || error}
        </WorkspaceFormBanner>
      ) : null}
      <div className="grid gap-3 md:grid-cols-3">
        <WorkspaceSelect
          value={reviewId}
          onValueChange={setReviewId}
          placeholder="Approved review"
          options={reviews.map((item) => ({
            value: String(item.id),
            label: `RV-${item.id} · ${item.planName} · ${item.tenant}`
          }))}
        />
        <Input
          value={requestedBy}
          onChange={(event) => setRequestedBy(event.target.value)}
          placeholder="Requested by"
        />
        <Input
          type="number"
          min={1}
          max={1000}
          value={batchSize}
          onChange={(event) => setBatchSize(event.target.value)}
          placeholder="Batch size"
        />
      </div>
      <Button disabled={pending} onClick={submit}>
        {pending ? "Queuing..." : "Queue execution"}
      </Button>
    </section>
  );
}
export function ConflictDecisionForm({
  conflict,
  pending,
  error,
  onSubmit
}: {
  conflict: ExecutionConflict;
  pending: boolean;
  error: string | undefined;
  onSubmit: (input: ConflictDecisionInput) => unknown;
}) {
  const [action, setAction] = useState<"override" | "reject">("reject");
  const [actor, setActor] = useState("");
  const [reason, setReason] = useState("");
  const [validation, setValidation] = useState("");
  const submit = () => {
    const result = conflictDecisionSchema.safeParse({ action, actor, reason });
    if (!result.success)
      return setValidation(result.error.issues[0]?.message ?? "Complete the conflict decision.");
    setValidation("");
    onSubmit(result.data);
  };
  return (
    <div className="space-y-3 rounded-md border border-destructive/30 bg-card p-4">
      <div>
        <p className="font-semibold">
          {conflict.id} · {conflict.table}
        </p>
        <p className="text-xs text-muted-foreground">
          {conflict.sourceRecordRef} → {conflict.targetRecordRef}
        </p>
      </div>
      {validation || error ? (
        <WorkspaceFormBanner title="Unable to save decision">
          {validation || error}
        </WorkspaceFormBanner>
      ) : null}
      <WorkspaceSelect
        value={action}
        onValueChange={(value) => setAction(value as "override" | "reject")}
        options={[
          { value: "reject", label: "Reject Source record" },
          { value: "override", label: "Explicitly override Target record" }
        ]}
      />
      <Input
        value={actor}
        onChange={(event) => setActor(event.target.value)}
        placeholder="Decision actor"
      />
      <Input
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Required decision reason"
      />
      <Button disabled={pending} onClick={submit}>
        Record decision
      </Button>
    </div>
  );
}
