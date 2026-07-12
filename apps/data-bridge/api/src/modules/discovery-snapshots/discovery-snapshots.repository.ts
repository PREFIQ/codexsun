import type { CompatibleDbPool } from "@codexsun/framework/db";
import type { SchemaTable, TableDifference } from "./discovery-snapshots.types.js";
type Row = Record<string, unknown>;
export class DiscoverySnapshotsRepository {
  constructor(private readonly db: CompatibleDbPool) {}
  async initialize() { await this.db.execute(`CREATE TABLE IF NOT EXISTS data_bridge_discovery_snapshots (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, migration_job_id BIGINT UNSIGNED NOT NULL,
    source_snapshot LONGTEXT NOT NULL, target_snapshot LONGTEXT NOT NULL, comparison LONGTEXT NOT NULL,
    source_table_count INT NOT NULL, target_table_count INT NOT NULL, difference_count INT NOT NULL,
    omitted_tables LONGTEXT NOT NULL DEFAULT '[]', mapping_input LONGTEXT NULL, prepared_at DATETIME NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_discovery_job (migration_job_id)
  )`); await this.db.execute("ALTER TABLE data_bridge_discovery_snapshots ADD COLUMN IF NOT EXISTS omitted_tables LONGTEXT NOT NULL DEFAULT '[]'"); await this.db.execute("ALTER TABLE data_bridge_discovery_snapshots ADD COLUMN IF NOT EXISTS mapping_input LONGTEXT NULL"); await this.db.execute("ALTER TABLE data_bridge_discovery_snapshots ADD COLUMN IF NOT EXISTS prepared_at DATETIME NULL"); }
  async create(jobId: number, source: SchemaTable[], target: SchemaTable[], comparison: TableDifference[]) {
    const [result] = await this.db.execute<{ insertId: number }>(`INSERT INTO data_bridge_discovery_snapshots
      (migration_job_id, source_snapshot, target_snapshot, comparison, source_table_count, target_table_count, difference_count)
      VALUES (?, ?, ?, ?, ?, ?, ?)`, [jobId, JSON.stringify(source), JSON.stringify(target), JSON.stringify(comparison), source.length, target.length, comparison.filter((item) => item.status !== "match").length]);
    return this.get(Number(result.insertId));
  }
  async list() { const [rows] = await this.db.execute<Row[]>(`SELECT s.id, s.migration_job_id, j.name job_name, j.source_database, j.target_database,
    s.source_table_count, s.target_table_count, s.difference_count, s.created_at FROM data_bridge_discovery_snapshots s
    JOIN data_bridge_migration_jobs j ON j.id=s.migration_job_id ORDER BY s.id DESC`); return rows.map(summary); }
  async get(id: number) { const [rows] = await this.db.execute<Row[]>(`SELECT s.*, j.name job_name, j.source_database, j.target_database FROM data_bridge_discovery_snapshots s
    JOIN data_bridge_migration_jobs j ON j.id=s.migration_job_id WHERE s.id=?`, [id]); const row=rows[0]; return row ? { ...summary(row), source: JSON.parse(String(row.source_snapshot)), target: JSON.parse(String(row.target_snapshot)), comparison: JSON.parse(String(row.comparison)), omittedTables: JSON.parse(String(row.omitted_tables??"[]")), mappingInput: row.mapping_input?JSON.parse(String(row.mapping_input)):null, preparedAt:row.prepared_at??null } : null; }
  async setOmittedTables(id: number, tables: string[]) { const snapshot=await this.get(id); if(!snapshot)return null; const differenceCount=snapshot.comparison.filter((item:TableDifference)=>item.status!=="match"&&!tables.includes(item.table)).length; await this.db.execute("UPDATE data_bridge_discovery_snapshots SET omitted_tables=?, difference_count=? WHERE id=?",[JSON.stringify(tables),differenceCount,id]); return this.get(id); }
  async prepareMappingInput(id:number){const snapshot=await this.get(id);if(!snapshot)return null;const selected=snapshot.comparison.filter((item:TableDifference)=>!snapshot.omittedTables.includes(item.table)).map((item:TableDifference)=>({table:item.table,status:item.status,differences:item.differences,source:snapshot.source.find((table:SchemaTable)=>table.name===item.table)??null,target:snapshot.target.find((table:SchemaTable)=>table.name===item.table)??null}));const payload={version:1,snapshotId:snapshot.id,migrationJobId:snapshot.migrationJobId,jobName:snapshot.jobName,direction:"source-to-target",selectedTableCount:selected.length,omittedTables:snapshot.omittedTables,tables:selected};await this.db.execute("UPDATE data_bridge_discovery_snapshots SET mapping_input=?, prepared_at=CURRENT_TIMESTAMP WHERE id=?",[JSON.stringify(payload),id]);return this.get(id);}
}
function summary(row: Row) { return { id:Number(row.id), migrationJobId:Number(row.migration_job_id), jobName:String(row.job_name), sourceDatabase:String(row.source_database), targetDatabase:String(row.target_database), sourceTableCount:Number(row.source_table_count), targetTableCount:Number(row.target_table_count), differenceCount:Number(row.difference_count), createdAt:row.created_at }; }
