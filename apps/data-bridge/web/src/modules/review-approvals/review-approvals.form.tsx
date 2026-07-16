import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { WorkspaceSelect } from "@codexsun/ui/workspace/select";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import { prepareReviewSchema, sendSelectedRecordsSchema } from "./review-approvals.schema";
import type {
  PrepareReviewInput,
  ReviewCandidate,
  SendSelectedRecordsInput
} from "./review-approvals.types";

export function ReviewPrepareForm({
  candidates,
  pending,
  error,
  onSubmit
}: {
  candidates: ReviewCandidate[];
  pending: boolean;
  error: string | undefined;
  onSubmit: (input: PrepareReviewInput) => unknown;
}) {
  const [transformPlanId, setTransformPlanId] = useState("");
  const [preparedBy, setPreparedBy] = useState("");
  const [validation, setValidation] = useState("");
  const submit = () => {
    const result = prepareReviewSchema.safeParse({
      transformPlanId: Number(transformPlanId),
      preparedBy
    });
    if (!result.success)
      return setValidation(
        result.error.issues[0]?.message ?? "Complete the review preparation form."
      );
    setValidation("");
    onSubmit(result.data);
  };
  return (
    <section className="space-y-3 rounded-md border bg-card p-4">
      <div>
        <h3 className="font-semibold">Prepare live data review</h3>
        <p className="text-sm text-muted-foreground">
          Reads Source and Target counts and prepares record-level comparison without writing data.
        </p>
      </div>
      {validation || error ? (
        <WorkspaceFormBanner title="Unable to prepare review">
          {validation || error}
        </WorkspaceFormBanner>
      ) : null}
      <div className="grid gap-3 md:grid-cols-2">
        <WorkspaceSelect
          value={transformPlanId}
          onValueChange={setTransformPlanId}
          placeholder="Approved transform plan"
          options={candidates
            .filter((item) => !item.reviewId)
            .map((item) => ({
              value: String(item.transformPlanId),
              label: `${item.name} (${item.tableCount} tables)`
            }))}
        />
        <Input
          value={preparedBy}
          onChange={(event) => setPreparedBy(event.target.value)}
          placeholder="Prepared by"
        />
      </div>
      <Button disabled={pending} onClick={submit}>
        {pending ? "Preparing records..." : "Prepare data review"}
      </Button>
    </section>
  );
}

export function SendSelectedRecordsForm({
  reviewId,
  selectionCount,
  pending,
  error,
  onSubmit
}: {
  reviewId: number;
  selectionCount: number;
  pending: boolean;
  error: string | undefined;
  onSubmit: (input: Omit<SendSelectedRecordsInput, "selections">) => unknown;
}) {
  const [requestedBy, setRequestedBy] = useState("");
  const [batchSize, setBatchSize] = useState(100);
  const [validation, setValidation] = useState("");
  const submit = () => {
    const result = sendSelectedRecordsSchema.safeParse({
      requestedBy,
      batchSize,
      selectionCount
    });
    if (!result.success)
      return setValidation(result.error.issues[0]?.message ?? "Complete the transfer form.");
    setValidation("");
    onSubmit({ reviewId, requestedBy: result.data.requestedBy, batchSize: result.data.batchSize });
  };
  return (
    <section className="space-y-3 rounded-md border bg-card p-4">
      <div>
        <h3 className="font-semibold">Send selected records</h3>
        <p className="text-sm text-muted-foreground">
          New records keep their mapped identity; different records receive a new Target identity.
        </p>
      </div>
      {validation || error ? (
        <WorkspaceFormBanner title="Unable to queue selected records">
          {validation || error}
        </WorkspaceFormBanner>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-[1fr_9rem_auto]">
        <Input
          value={requestedBy}
          onChange={(event) => setRequestedBy(event.target.value)}
          placeholder="Operator name"
        />
        <Input
          min={1}
          max={1000}
          type="number"
          value={batchSize}
          onChange={(event) => setBatchSize(Number(event.target.value))}
          aria-label="Batch size"
        />
        <Button disabled={pending || selectionCount === 0} onClick={submit}>
          <Send className="size-4" />
          {pending ? "Queuing..." : `Send ${selectionCount} selected`}
        </Button>
      </div>
    </section>
  );
}
