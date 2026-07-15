import { useState } from "react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { WorkspaceSelect } from "@codexsun/ui/workspace/select";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import {
  approveReviewSchema,
  prepareReviewSchema,
  reviewDecisionSchema
} from "./review-approvals.schema";
import type {
  ApproveReviewInput,
  PrepareReviewInput,
  ReviewApproval,
  ReviewCandidate,
  ReviewDecisionInput
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
        <h3 className="font-semibold">Prepare live dry run</h3>
        <p className="text-sm text-muted-foreground">
          Counts Source and Target rows and locks the approved query checksum.
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
        {pending ? "Running dry run..." : "Prepare review"}
      </Button>
    </section>
  );
}

export function ReviewDecisionForm({
  review,
  pending,
  error,
  onApprove,
  onReject,
  onRevoke
}: {
  review: ReviewApproval;
  pending: boolean;
  error: string | undefined;
  onApprove: (input: ApproveReviewInput) => unknown;
  onReject: (input: ReviewDecisionInput) => unknown;
  onRevoke: (input: ReviewDecisionInput) => unknown;
}) {
  const [actor, setActor] = useState("");
  const [reference, setReference] = useState("");
  const [reason, setReason] = useState("");
  const [validation, setValidation] = useState("");
  const decide = (action: "approve" | "reject" | "revoke") => {
    const result =
      action === "approve"
        ? approveReviewSchema.safeParse({ approver: actor, approvalReference: reference, reason })
        : reviewDecisionSchema.safeParse({ actor, reason });
    if (!result.success)
      return setValidation(result.error.issues[0]?.message ?? "Complete the decision form.");
    setValidation("");
    if (action === "approve") onApprove(result.data as ApproveReviewInput);
    else if (action === "reject") onReject(result.data as ReviewDecisionInput);
    else onRevoke(result.data as ReviewDecisionInput);
  };
  return (
    <section className="space-y-3 rounded-md border bg-card p-4">
      <h3 className="font-semibold">Review decision</h3>
      {validation || error ? (
        <WorkspaceFormBanner title="Unable to record decision">
          {validation || error}
        </WorkspaceFormBanner>
      ) : null}
      <div className="grid gap-3 md:grid-cols-2">
        <Input
          value={actor}
          onChange={(event) => setActor(event.target.value)}
          placeholder={
            review.status === "pending" ? "Approver (must differ from preparer)" : "Decision actor"
          }
        />
        <Input
          value={reference}
          onChange={(event) => setReference(event.target.value)}
          placeholder="Approval reference"
          disabled={review.status !== "pending"}
        />
      </div>
      <Input
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Decision reason"
      />
      <div className="flex flex-wrap gap-2">
        {review.status === "pending" ? (
          <>
            <Button disabled={pending || !review.dryRunSucceeded} onClick={() => decide("approve")}>
              Approve execution
            </Button>
            <Button variant="outline" disabled={pending} onClick={() => decide("reject")}>
              Reject
            </Button>
          </>
        ) : null}
        {review.status === "approved" ? (
          <Button variant="outline" disabled={pending} onClick={() => decide("revoke")}>
            Revoke approval
          </Button>
        ) : null}
      </div>
    </section>
  );
}
