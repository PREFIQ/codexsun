import { useQuery } from "@tanstack/react-query";
import { listEntryRecords } from "./entries.services";
import type { EntryKind } from "./entries.types";

export function useEntryRecords(kind: EntryKind, search = "") {
  return useQuery({ queryFn: () => listEntryRecords(kind, search), queryKey: ["entries", kind, search] });
}
