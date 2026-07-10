import { useQuery } from "@tanstack/react-query";
import { listMasterRecords } from "./master.services";
import type { MasterDefinition } from "./master.types";

export function useMasterRecords(definition: MasterDefinition, search = "") {
  return useQuery({
    queryFn: () => listMasterRecords(definition, search),
    queryKey: ["core", "master", definition.kind, search]
  });
}
