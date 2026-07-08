export type CountryStatus = "active" | "inactive";

export type Country = {
  capital: string | null;
  currencyCode: string;
  dialCode: string;
  id: string;
  iso2: string;
  iso3: string;
  name: string;
  numericCode: string;
  status: CountryStatus;
};

export type CountrySavePayload = Omit<Country, "id">;
