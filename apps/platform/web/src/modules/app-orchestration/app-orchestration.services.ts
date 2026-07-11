import { apiGet, apiPost } from "../../shared/api/platform-api";
import type { OrchestratedApp, OrchestratedAppId } from "./app-orchestration.types";
type ServiceId = "api" | "web";
export const listOrchestratedApps = () => apiGet<OrchestratedApp[]>("/admin/app-operations", "sa");
export const startOrchestratedApp = (id: OrchestratedAppId) =>
  apiPost(`/admin/app-operations/${id}/start`, {}, "sa");
export const stopOrchestratedApp = (id: OrchestratedAppId) =>
  apiPost(`/admin/app-operations/${id}/stop`, {}, "sa");
export const updateOrchestratedApp = (id: OrchestratedAppId) =>
  apiPost(`/admin/app-operations/${id}/update`, {}, "sa");
export const startOrchestratedService = (id: OrchestratedAppId, serviceId: ServiceId) =>
  apiPost(`/admin/app-operations/${id}/services/${serviceId}/start`, {}, "sa");
export const stopOrchestratedService = (id: OrchestratedAppId, serviceId: ServiceId) =>
  apiPost(`/admin/app-operations/${id}/services/${serviceId}/stop`, {}, "sa");
export const restartOrchestratedService = (id: OrchestratedAppId, serviceId: ServiceId) =>
  apiPost(`/admin/app-operations/${id}/services/${serviceId}/restart`, {}, "sa");
