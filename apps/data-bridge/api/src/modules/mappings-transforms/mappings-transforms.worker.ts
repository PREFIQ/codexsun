import type { MappingTable } from "./mappings-transforms.types.js";
export function processMappingQueries(mappings: MappingTable[]) {
  return mappings.map((mapping) => {
    const fields = mapping.fields.filter((field) => !field.skipped && field.targetColumn);
    return {
      sourceTable: mapping.sourceTable,
      targetTable: mapping.targetTable,
      group: mapping.group ?? "",
      fields: fields.map((field) => ({
        sourceField: field.sourceColumn,
        targetField: field.targetColumn
      })),
      sourceQuery: `SELECT ${fields.map((field) => identifier(field.sourceColumn)).join(", ")} FROM ${identifier(mapping.sourceTable)};`,
      targetQuery: `INSERT INTO ${identifier(mapping.targetTable)} (${fields.map((field) => identifier(field.targetColumn)).join(", ")}) VALUES (${fields.map(() => "?").join(", ")});`
    };
  });
}
function identifier(value: string) {
  return `\`${value.replace(/`/g, "``")}\``;
}
