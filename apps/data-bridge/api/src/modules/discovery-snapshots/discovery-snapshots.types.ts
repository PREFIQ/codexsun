export type SchemaColumn = { name: string; type: string; nullable: boolean; defaultValue: string | null; key: string; extra: string };
export type SchemaTable = { name: string; type: string; estimatedRows: number; columns: SchemaColumn[] };
export type TableDifference = { table: string; status: "match" | "missing-target" | "target-only" | "different"; differences: string[] };
