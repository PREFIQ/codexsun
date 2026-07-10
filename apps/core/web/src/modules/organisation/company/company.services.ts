import { createMasterRecord, listMasterRecords, updateMasterRecord } from "../../master/master.services";
import type { MasterSavePayload } from "../../master/master.types";
import { companyDefinition } from "./company.definition";

export const listCompanys = (search = "") => listMasterRecords(companyDefinition, search);
export const createCompany = (payload: MasterSavePayload) => createMasterRecord(companyDefinition, payload);
export const updateCompany = (id: string, payload: MasterSavePayload) => updateMasterRecord(companyDefinition, id, payload);
