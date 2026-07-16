import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listReviewApprovals,
  listReviewCandidates,
  prepareReview,
  previewReviewRecords,
  refreshReview,
  sendSelectedRecords
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
export function useReviewRecordPreview(reviewId: number | null, targetTable: string) {
  return useQuery({
    queryKey: [...reviewKeys.all, reviewId, "records", targetTable],
    queryFn: () => previewReviewRecords(reviewId!, targetTable),
    enabled: reviewId !== null && Boolean(targetTable)
  });
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
    refresh: useMutation({ mutationFn: refreshReview, onSuccess: refresh }),
    sendSelected: useMutation({ mutationFn: sendSelectedRecords })
  };
}
