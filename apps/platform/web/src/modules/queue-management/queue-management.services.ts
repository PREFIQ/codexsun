import { apiGet, apiPost } from "../../shared/api/platform-api";
import type { QueueJobRecord, QueueRuntimeSettings } from "./queue-management.types";

export function getQueueRuntimeSettings() {
  return apiGet<QueueRuntimeSettings>("/admin/queue/settings", "sa");
}

export function listQueueJobs() {
  return apiGet<QueueJobRecord[]>("/admin/queue/jobs", "sa");
}

export function runQueueJob(id: number) {
  return apiPost<QueueJobRecord>(`/admin/queue/jobs/${id}/run`, {}, "sa");
}

export function retryQueueJob(id: number) {
  return apiPost<QueueJobRecord>(`/admin/queue/jobs/${id}/retry`, {}, "sa");
}

export function cancelQueueJob(id: number) {
  return apiPost<QueueJobRecord>(`/admin/queue/jobs/${id}/cancel`, {}, "sa");
}
