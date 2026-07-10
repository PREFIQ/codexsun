import { masterDefinitions } from "../master.registry.js";
export const workOrderDefinition = masterDefinitions.find((definition) => definition.key === "work-order")!;
