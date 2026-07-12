import { useQuery } from "@tanstack/react-query";
import { listCompanies, listCompanyIndustries } from "./company.services";
export function useCompanies(search = "") {
  return useQuery({
    queryFn: () => listCompanies(search),
    queryKey: ["core", "company", "list", search]
  });
}
export function useCompanyIndustries() {
  return useQuery({ queryFn: listCompanyIndustries, queryKey: ["core", "company", "industries"] });
}
