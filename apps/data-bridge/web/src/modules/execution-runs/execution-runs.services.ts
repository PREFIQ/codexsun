import type {
  ConflictDecisionInput,
  CreateExecutionInput,
  ExecutionReviewOption,
  ExecutionRun
} from "./execution-runs.types";
const base = import.meta.env.VITE_DATA_BRIDGE_API_URL ?? "http://127.0.0.1:7090";
const path = "/data-bridge/execution-runs";
async function request<T>(url: string, init?: RequestInit) {
  const options: RequestInit = { ...init };
  if (init?.body) {
    const headers = new Headers(init.headers);
    headers.set("content-type", "application/json");
    options.headers = headers;
  }
  const response = await fetch(`${base}${url}`, options);
  const body = (await response.json()) as {
    data?: T;
    error?: { message?: string };
    message?: string;
  };
  if (!response.ok || body.data === undefined)
    throw new Error(body.error?.message ?? body.message ?? "Execution request failed.");
  return body.data;
}
export const listExecutionRuns = () => request<ExecutionRun[]>(path);
export const listExecutionReviewOptions = async () =>
  (await request<ExecutionReviewOption[]>("/data-bridge/review-approvals")).filter(
    (item) => item.status === "approved" && item.dryRunSucceeded && item.approvalReference
  );
export const createExecutionRun = (input: CreateExecutionInput) =>
  request<ExecutionRun>(path, { method: "POST", body: JSON.stringify(input) });
export const executionAction = (
  id: number,
  action: "pause" | "resume" | "cancel" | "retry",
  actor: string
) =>
  request<ExecutionRun>(`${path}/${id}/${action}`, {
    method: "POST",
    body: JSON.stringify({ actor })
  });
export const decideExecutionConflict = (
  id: number,
  conflictId: string,
  input: ConflictDecisionInput
) =>
  request<ExecutionRun>(`${path}/${id}/conflicts/${conflictId}/decision`, {
    method: "POST",
    body: JSON.stringify(input)
  });
