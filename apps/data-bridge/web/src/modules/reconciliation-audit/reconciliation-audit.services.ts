import type {
  AddExceptionInput,
  CompletedExecutionOption,
  GenerateReportInput,
  ReconciliationReport,
  SignOffInput
} from "./reconciliation-audit.types";
const base = import.meta.env.VITE_DATA_BRIDGE_API_URL ?? "http://127.0.0.1:7090";
const path = "/data-bridge/reconciliation-reports";
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
    throw new Error(body.error?.message ?? body.message ?? "Reconciliation request failed.");
  return body.data;
}
export const listReconciliationReports = () => request<ReconciliationReport[]>(path);
export const listCompletedExecutionOptions = async () =>
  (await request<CompletedExecutionOption[]>("/data-bridge/execution-runs")).filter(
    (item) => item.status === "completed"
  );
export const generateReconciliationReport = (input: GenerateReportInput) =>
  request<ReconciliationReport>(path, { method: "POST", body: JSON.stringify(input) });
export const addReconciliationException = (id: number, input: AddExceptionInput) =>
  request<ReconciliationReport>(`${path}/${id}/exceptions`, {
    method: "POST",
    body: JSON.stringify(input)
  });
export const resolveReconciliationException = (
  id: number,
  exceptionId: string,
  input: { actor: string; resolution: string }
) =>
  request<ReconciliationReport>(`${path}/${id}/exceptions/${exceptionId}/resolve`, {
    method: "POST",
    body: JSON.stringify(input)
  });
export const signOffReconciliation = (id: number, input: SignOffInput) =>
  request<ReconciliationReport>(`${path}/${id}/sign-off`, {
    method: "POST",
    body: JSON.stringify(input)
  });
export const exportReconciliationAudit = (id: number) =>
  request<{ exportedAt: string; report: ReconciliationReport; checksum: string }>(
    `${path}/${id}/audit-export`
  );
