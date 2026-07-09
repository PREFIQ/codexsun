import { Button, Input, StatusBadge } from "@codexsun/ui";
import type { LocationDefinition, LocationSavePayload } from "./location.types";

export function LocationForm({
  definition,
  onSubmit,
  value
}: {
  definition: LocationDefinition;
  onSubmit: (value: LocationSavePayload) => void;
  value: LocationSavePayload;
}) {
  return (
    <form
      className="country-panel"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(value);
      }}
    >
      <div className="country-panel-header">
        <div>
          <strong>{definition.label} form</strong>
          <small>Shared location upsert contract</small>
        </div>
        <StatusBadge tone="blue">DB backed</StatusBadge>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Input aria-label={`${definition.label} code`} name="code" required value={value.code} readOnly />
        <Input aria-label={`${definition.label} name`} name="name" required value={value.name} readOnly />
      </div>
      <Button className="mt-4" type="submit">
        Save
      </Button>
    </form>
  );
}

