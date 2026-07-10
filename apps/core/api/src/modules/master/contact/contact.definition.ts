import { masterDefinitions } from "../master.registry.js";
export const contactDefinition = masterDefinitions.find((definition) => definition.key === "contact")!;
