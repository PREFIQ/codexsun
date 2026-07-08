import { CountryList } from "./country.list";
import { useCountries } from "./country.hooks";

export function CountryWorkspace() {
  const countries = useCountries();
  if (countries.isLoading) return <p>Loading country records...</p>;
  if (countries.isError) return <p>Country records are unavailable.</p>;
  return <CountryList countries={countries.data ?? []} onSelect={() => undefined} />;
}
