import { masterDefinitions } from "../master.registry.js";
export const productDefinition = masterDefinitions.find((definition) => definition.key === "product")!;
