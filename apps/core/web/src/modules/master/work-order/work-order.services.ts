import { createMasterRecord, forceDeleteMasterRecord, listMasterLookup, listMasterRecords, setMasterRecordActive, updateMasterRecord } from "../master.services";
import { workOrderDefinition } from "./work-order.definition";
import type { WorkOrderSavePayload } from "./work-order.types";

export type { MasterLookupRecord as WorkOrderLookupRecord } from "../master.services";

export function listWorkOrders(search = "") {
  return listMasterRecords(workOrderDefinition, search);
}

export function createWorkOrder(payload: WorkOrderSavePayload) {
  return createMasterRecord(workOrderDefinition, payload);
}

export function updateWorkOrder(id: string, payload: WorkOrderSavePayload) {
  return updateMasterRecord(workOrderDefinition, id, payload);
}

export function setWorkOrderActive(id: string, active: boolean) {
  return setMasterRecordActive(workOrderDefinition, id, active);
}

export function forceDeleteWorkOrder(id: string) {
  return forceDeleteMasterRecord(workOrderDefinition, id);
}

export function listWorkOrderLookup(path: string) {
  return listMasterLookup(path);
}
