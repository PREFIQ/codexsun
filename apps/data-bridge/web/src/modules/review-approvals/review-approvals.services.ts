import type {
  ApproveReviewInput,
  PrepareReviewInput,
  ReviewApproval,
  ReviewCandidate,
  ReviewDecisionInput
} from "./review-approvals.types";
const base = import.meta.env.VITE_DATA_BRIDGE_API_URL ?? "http://127.0.0.1:7090";
async function request<T>(path: string, init?: RequestInit) {
  const options: RequestInit = { ...init };
  if (init?.body) {
    const headers = new Headers(init.headers);
    headers.set("content-type", "application/json");
    options.headers = headers;
  }
  const response = await fetch(`${base}${path}`, options);
  const body = (await response.json()) as {
    data?: T;
    error?: { message?: string };
    message?: string;
  };
  if (!response.ok || body.data === undefined)
    throw new Error(body.error?.message ?? body.message ?? "Review request failed.");
  return body.data;
}
const path = "/data-bridge/review-approvals";
export const listReviewApprovals = () => request<ReviewApproval[]>(path);
export const listReviewCandidates = () => request<ReviewCandidate[]>(`${path}/candidates`);
export const prepareReview = (input: PrepareReviewInput) =>
  request<ReviewApproval>(path, { method: "POST", body: JSON.stringify(input) });
export const approveReview = (id: number, input: ApproveReviewInput) =>
  request<ReviewApproval>(`${path}/${id}/approve`, { method: "POST", body: JSON.stringify(input) });
export const rejectReview = (id: number, input: ReviewDecisionInput) =>
  request<ReviewApproval>(`${path}/${id}/reject`, { method: "POST", body: JSON.stringify(input) });
export const revokeReview = (id: number, input: ReviewDecisionInput) =>
  request<ReviewApproval>(`${path}/${id}/revoke`, { method: "POST", body: JSON.stringify(input) });
