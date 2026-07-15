import { createDatabaseConnector } from "@codexsun/framework/db";
import type { DatabaseSettings } from "../migration-manager/index.js";
import type { SchemaColumn, SchemaTable, TableDifference } from "./discovery-snapshots.types.js";

type MetaRow = Record<string, unknown>;
export async function processDatabaseDiscovery(config: DatabaseSettings): Promise<SchemaTable[]> {
  const connection = await createDatabaseConnector({ ...config, driver: config.type }).connect({
    database: config.database
  });
  try {
    const [tableRows] = await connection.execute<MetaRow[]>(
      "SELECT TABLE_NAME, TABLE_TYPE, COALESCE(TABLE_ROWS,0) TABLE_ROWS FROM information_schema.TABLES WHERE TABLE_SCHEMA=? ORDER BY TABLE_NAME",
      [config.database]
    );
    const [columnRows] = await connection.execute<MetaRow[]>(
      "SELECT TABLE_NAME,COLUMN_NAME,COLUMN_TYPE,IS_NULLABLE,COLUMN_DEFAULT,COLUMN_KEY,EXTRA FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? ORDER BY TABLE_NAME,ORDINAL_POSITION",
      [config.database]
    );
    return tableRows.map((table) => ({
      name: String(table.TABLE_NAME),
      type: String(table.TABLE_TYPE),
      estimatedRows: Number(table.TABLE_ROWS),
      columns: columnRows
        .filter((column) => column.TABLE_NAME === table.TABLE_NAME)
        .map((column): SchemaColumn => ({
          name: String(column.COLUMN_NAME),
          type: String(column.COLUMN_TYPE),
          nullable: column.IS_NULLABLE === "YES",
          defaultValue: column.COLUMN_DEFAULT === null ? null : String(column.COLUMN_DEFAULT),
          key: String(column.COLUMN_KEY ?? ""),
          extra: String(column.EXTRA ?? "")
        }))
    }));
  } finally {
    await connection.end();
  }
}

export function processDiscoveryComparison(
  source: SchemaTable[],
  target: SchemaTable[]
): TableDifference[] {
  const names = new Set([...source.map((item) => item.name), ...target.map((item) => item.name)]);
  return [...names].sort().map((table) => {
    const left = source.find((item) => item.name === table);
    const right = target.find((item) => item.name === table);
    if (!right)
      return { table, status: "missing-target", differences: ["Table is missing in target"] };
    if (!left)
      return { table, status: "target-only", differences: ["Table exists only in target"] };
    const differences: string[] = [];
    const columns = new Set([
      ...left.columns.map((item) => item.name),
      ...right.columns.map((item) => item.name)
    ]);
    for (const name of columns) {
      const sourceColumn = left.columns.find((item) => item.name === name);
      const targetColumn = right.columns.find((item) => item.name === name);
      if (!targetColumn) {
        differences.push(`Column ${name} is missing in target`);
        continue;
      }
      if (!sourceColumn) {
        differences.push(`Column ${name} exists only in target`);
        continue;
      }
      if (sourceColumn.type !== targetColumn.type)
        differences.push(`${name}: type ${sourceColumn.type} to ${targetColumn.type}`);
      if (sourceColumn.nullable !== targetColumn.nullable)
        differences.push(`${name}: nullable ${sourceColumn.nullable} to ${targetColumn.nullable}`);
      if (sourceColumn.defaultValue !== targetColumn.defaultValue)
        differences.push(
          `${name}: default ${sourceColumn.defaultValue ?? "NULL"} to ${targetColumn.defaultValue ?? "NULL"}`
        );
      if (sourceColumn.key !== targetColumn.key)
        differences.push(
          `${name}: key ${sourceColumn.key || "none"} to ${targetColumn.key || "none"}`
        );
      if (sourceColumn.extra !== targetColumn.extra)
        differences.push(
          `${name}: extra ${sourceColumn.extra || "none"} to ${targetColumn.extra || "none"}`
        );
    }
    return { table, status: differences.length ? "different" : "match", differences };
  });
}
