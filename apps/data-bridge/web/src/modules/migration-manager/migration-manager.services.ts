import type { MigrationJob, MigrationJobInput, SmokeResult } from "./migration-manager.types";
const base = import.meta.env.VITE_DATA_BRIDGE_API_URL ?? "http://127.0.0.1:7090";
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const options: RequestInit = { ...init };
  if (init?.body) {
    const headers = new Headers(init.headers);
    headers.set("content-type", "application/json");
    options.headers = headers;
  }
  const response = await fetch(`${base}${path}`, options);
  const body = (await response.json()) as { data?: T; message?: string };
  if (!response.ok || body.data === undefined)
    throw new Error(body.message ?? "Data Bridge request failed.");
  return body.data;
}
export const listMigrationJobs = () => request<MigrationJob[]>("/data-bridge/migration-jobs");
export const createMigrationJob = (input: MigrationJobInput) =>
  request<MigrationJob>("/data-bridge/migration-jobs", {
    method: "POST",
    body: JSON.stringify(input)
  });
export const updateMigrationJob = (id: number, input: MigrationJobInput) =>
  request<MigrationJob>(`/data-bridge/migration-jobs/${id}`, {
    method: "PUT",
    body: JSON.stringify(input)
  });
export const smokeTestMigrationDatabase = (id: number, side: "source" | "target") =>
  request<SmokeResult>(`/data-bridge/migration-jobs/${id}/smoke-test/${side}`, { method: "POST" });
