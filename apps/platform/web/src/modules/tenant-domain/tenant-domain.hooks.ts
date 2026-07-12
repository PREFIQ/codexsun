import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTenantDomain,
  listAllTenantDomains,
  updateTenantDomain
} from "./tenant-domain.services";
import type { TenantDomainSavePayload } from "./tenant-domain.types";

export const tenantDomainQueryKey = ["admin", "tenant-domains"] as const;

export function useTenantDomainsQuery() {
  return useQuery({ queryFn: listAllTenantDomains, queryKey: tenantDomainQueryKey });
}

export function useCreateTenantDomainMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTenantDomain,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tenantDomainQueryKey })
  });
}

export function useUpdateTenantDomainMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: TenantDomainSavePayload }) =>
      updateTenantDomain(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tenantDomainQueryKey })
  });
}
