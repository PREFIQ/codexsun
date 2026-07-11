import type { MigrationWorkflow } from "./migration-projects.types";

const apiUrl = import.meta.env.VITE_DATA_BRIDGE_API_URL ?? "http://127.0.0.1:7090";
export async function fetchMigrationWorkflow(): Promise<MigrationWorkflow> {
  const response = await fetch(`${apiUrl}/data-bridge/workflow`, {
    headers: { accept: "application/json" }
  });
  if (!response.ok) throw new Error("Unable to load the Data Bridge workflow.");
  return ((await response.json()) as { data: MigrationWorkflow }).data;
}
