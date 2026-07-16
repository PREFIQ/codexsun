import type {
  PrepareReviewInput,
  ReviewApproval,
  ReviewCandidate,
  ReviewRecordPreview,
  SelectedExecutionRun,
  SendSelectedRecordsInput
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
export const refreshReview = (id: number) =>
  request<ReviewApproval>(`${path}/${id}/refresh`, { method: "POST" });
export const previewReviewRecords = (id: number, targetTable: string) =>
  request<ReviewRecordPreview>(
    `${path}/${id}/records?table=${encodeURIComponent(targetTable)}&limit=50`
  );
export const sendSelectedRecords = (input: SendSelectedRecordsInput) =>
  request<SelectedExecutionRun>("/data-bridge/execution-runs/selected", {
    method: "POST",
    body: JSON.stringify(input)
  });
