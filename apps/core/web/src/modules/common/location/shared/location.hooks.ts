import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createLocationRecord, listLocationRecords, updateLocationRecord } from "./location.services";
import type { LocationDefinition } from "./location.types";

export function useLocationRecords(definition: LocationDefinition) {
  return useQuery({
    queryFn: () => listLocationRecords(definition.path),
    queryKey: ["core", "common", "location", definition.kind]
  });
}

export function useCreateLocationRecord(definition: LocationDefinition) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof createLocationRecord>[1]) => createLocationRecord(definition.path, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["core", "common", "location", definition.kind] })
  });
}

export function useUpdateLocationRecord(definition: LocationDefinition) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateLocationRecord>[2] }) =>
      updateLocationRecord(definition.path, id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["core", "common", "location", definition.kind] })
  });
}

