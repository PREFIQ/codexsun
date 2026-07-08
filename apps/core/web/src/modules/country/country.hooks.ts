import { useQuery } from "@tanstack/react-query";
import { listCountries } from "./country.services";

export function useCountries() {
  return useQuery({
    queryFn: listCountries,
    queryKey: ["core", "countries"]
  });
}
