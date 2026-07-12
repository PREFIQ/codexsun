import { useQuery } from "@tanstack/react-query";
import {
  getAccountsReports,
  getAccountsSettings,
  listAccountGroups,
  listLedgers,
  listVouchers
} from "./accounts.services";

export function useAccountGroups() {
  return useQuery({ queryFn: listAccountGroups, queryKey: ["accounts", "groups"] });
}

export function useLedgers(search = "") {
  return useQuery({
    queryFn: () => listLedgers(search),
    queryKey: ["accounts", "ledgers", search]
  });
}

export function useVouchers(search = "") {
  return useQuery({
    queryFn: () => listVouchers(search),
    queryKey: ["accounts", "vouchers", search]
  });
}

export function useAccountsReports() {
  return useQuery({ queryFn: getAccountsReports, queryKey: ["accounts", "reports"] });
}

export function useAccountsSettings() {
  return useQuery({ queryFn: getAccountsSettings, queryKey: ["accounts", "settings"] });
}
