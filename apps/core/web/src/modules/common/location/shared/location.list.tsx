import { StatusBadge } from "@codexsun/ui";
import type { LocationDefinition, LocationRecord } from "./location.types";

export function LocationList({
  definition,
  onSelect,
  records
}: {
  definition: LocationDefinition;
  onSelect: (record: LocationRecord) => void;
  records: LocationRecord[];
}) {
  if (records.length === 0) return <div className="country-empty">No {definition.label.toLowerCase()} records found.</div>;

  return (
    <div className="country-table" role="table">
      <div className="country-row country-row-head" role="row">
        {definition.columns.map((column) => (
          <span key={column}>{labelFor(column)}</span>
        ))}
      </div>
      {records.map((record) => (
        <button className="country-row w-full text-left" key={record.id} onClick={() => onSelect(record)} role="row" type="button">
          {definition.columns.map((column) => (
            <span key={column}>{renderCell(record, column)}</span>
          ))}
        </button>
      ))}
    </div>
  );
}

function renderCell(record: LocationRecord, column: keyof LocationRecord) {
  if (column === "status") {
    return <StatusBadge tone={record.status === "active" ? "green" : "neutral"}>{record.status}</StatusBadge>;
  }
  return String(record[column] ?? "-");
}

function labelFor(column: keyof LocationRecord) {
  return String(column).replace(/([A-Z])/g, " $1").replace(/^./, (value) => value.toUpperCase());
}

