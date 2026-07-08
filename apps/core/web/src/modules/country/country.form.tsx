import { Button, Input } from "@codexsun/ui";
import type { CountrySavePayload } from "./country.types";

export function CountryForm({ onSubmit, value }: { onSubmit: (value: CountrySavePayload) => void; value: CountrySavePayload }) {
  return (
    <form onSubmit={(event) => { event.preventDefault(); onSubmit(value); }}>
      <div className="grid gap-3 md:grid-cols-2">
        <Input aria-label="Country name" name="name" required value={value.name} readOnly />
        <Input aria-label="ISO 2 code" name="iso2" required value={value.iso2} readOnly />
        <Input aria-label="ISO 3 code" name="iso3" required value={value.iso3} readOnly />
        <Input aria-label="Currency code" name="currencyCode" required value={value.currencyCode} readOnly />
      </div>
      <Button className="mt-4" type="submit">Save country</Button>
    </form>
  );
}
