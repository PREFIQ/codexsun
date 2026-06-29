export type {
  CoreDefinitionKey, CoreDefinition, CoreDefinitionField,
  CoreRecord, CoreRecordCreate, CoreRecordUpdate,
} from "./contracts.js";
export { 
  coreDefinitions, defaultSeedRecords, coreCommonPermissions,
  getCoreDefinition, listCoreDefinitions,
} from "./contracts.js";
export type { CoreRecordRepository } from "./repository.js";
export { InMemoryCoreRecordRepository } from "./repository.js";
export { CoreDefinitionService, CoreRecordService } from "./service.js";
