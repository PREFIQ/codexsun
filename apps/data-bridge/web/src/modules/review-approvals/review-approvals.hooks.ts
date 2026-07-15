import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approveReview,
  listReviewApprovals,
  listReviewCandidates,
  prepareReview,
  rejectReview,
  revokeReview
} from "./review-approvals.services";
export const reviewKeys = {
  all: ["data-bridge", "review-approvals"] as const,
  candidates: ["data-bridge", "review-candidates"] as const
};
export function useReviewApprovals() {
  return useQuery({
    queryKey: reviewKeys.all,
    queryFn: listReviewApprovals,
    refetchInterval: 5000
  });
}
export function useReviewCandidates() {
  return useQuery({ queryKey: reviewKeys.candidates, queryFn: listReviewCandidates });
}
export function useReviewActions() {
  const client = useQueryClient();
  const refresh = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: reviewKeys.all }),
      client.invalidateQueries({ queryKey: reviewKeys.candidates })
    ]);
  };
  return {
    prepare: useMutation({ mutationFn: prepareReview, onSuccess: refresh }),
    approve: useMutation({
      mutationFn: ({
        id,
        input
      }: Parameters<typeof approveReview> extends [number, infer I]
        ? { id: number; input: I }
        : never) => approveReview(id, input),
      onSuccess: refresh
    }),
    reject: useMutation({
      mutationFn: ({
        id,
        input
      }: Parameters<typeof rejectReview> extends [number, infer I]
        ? { id: number; input: I }
        : never) => rejectReview(id, input),
      onSuccess: refresh
    }),
    revoke: useMutation({
      mutationFn: ({
        id,
        input
      }: Parameters<typeof revokeReview> extends [number, infer I]
        ? { id: number; input: I }
        : never) => revokeReview(id, input),
      onSuccess: refresh
    })
  };
}
