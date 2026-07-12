import type { FastifyInstance } from "fastify";
import { createDatabaseConnector, type CompatibleDbPool } from "@codexsun/framework/db";
import { MigrationManagerRepository } from "../migration-manager/migration-manager.repository.js";
import { DiscoverySnapshotsRepository } from "./discovery-snapshots.repository.js";
import type { SchemaColumn, SchemaTable, TableDifference } from "./discovery-snapshots.types.js";
type MetaRow = Record<string, unknown>;
export async function registerDiscoverySnapshotRoutes(app: FastifyInstance, database: CompatibleDbPool) {
  const snapshots = new DiscoverySnapshotsRepository(database); const jobs = new MigrationManagerRepository(database); await snapshots.initialize();
  app.get("/data-bridge/discovery-snapshots", async () => ({ data: await snapshots.list() }));
  app.get("/data-bridge/discovery-snapshots/:id", async (request, reply) => { const item=await snapshots.get(Number((request.params as {id:string}).id)); return item ? {data:item} : reply.code(404).send({message:"Discovery snapshot not found."}); });
  app.patch("/data-bridge/discovery-snapshots/:id/omitted-tables", async (request, reply) => { const tables=(request.body as {tables?:unknown})?.tables; if(!Array.isArray(tables)||!tables.every((item)=>typeof item==="string"))return reply.code(400).send({message:"Tables must be a string array."}); const item=await snapshots.setOmittedTables(Number((request.params as {id:string}).id),tables); return item?{data:item}:reply.code(404).send({message:"Discovery snapshot not found."}); });
  app.post("/data-bridge/discovery-snapshots/:id/prepare-mappings",async(request,reply)=>{const item=await snapshots.prepareMappingInput(Number((request.params as {id:string}).id));return item?{data:item}:reply.code(404).send({message:"Discovery snapshot not found."});});
  app.post("/data-bridge/discovery-snapshots", async (request, reply) => {
    const jobId=Number((request.body as {migrationJobId?:number})?.migrationJobId); const job=await jobs.secretSettings(jobId);
    if (!job) return reply.code(404).send({message:"Migration job not found."});
    try { const [source,target]=await Promise.all([discover(job.source),discover(job.target)]); return reply.code(201).send({data:await snapshots.create(jobId,source,target,compare(source,target))}); }
    catch { return reply.code(422).send({message:"Discovery failed. Verify both database connections and permissions."}); }
  });
}
async function discover(config: {type:"mariadb"|"mysql2";host:string;port:number;user:string;password:string;database:string}): Promise<SchemaTable[]> {
  const connection=await createDatabaseConnector(config).connect({database:config.database});
  try { const [tableRows]=await connection.execute<MetaRow[]>(`SELECT TABLE_NAME, TABLE_TYPE, COALESCE(TABLE_ROWS,0) TABLE_ROWS FROM information_schema.TABLES WHERE TABLE_SCHEMA=? ORDER BY TABLE_NAME`,[config.database]);
    const [columnRows]=await connection.execute<MetaRow[]>(`SELECT TABLE_NAME,COLUMN_NAME,COLUMN_TYPE,IS_NULLABLE,COLUMN_DEFAULT,COLUMN_KEY,EXTRA FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? ORDER BY TABLE_NAME,ORDINAL_POSITION`,[config.database]);
    return tableRows.map((table) => ({name:String(table.TABLE_NAME),type:String(table.TABLE_TYPE),estimatedRows:Number(table.TABLE_ROWS),columns:columnRows.filter((column)=>column.TABLE_NAME===table.TABLE_NAME).map((column):SchemaColumn=>({name:String(column.COLUMN_NAME),type:String(column.COLUMN_TYPE),nullable:column.IS_NULLABLE==="YES",defaultValue:column.COLUMN_DEFAULT===null?null:String(column.COLUMN_DEFAULT),key:String(column.COLUMN_KEY??""),extra:String(column.EXTRA??"")}))}));
  } finally { await connection.end(); }
}
function compare(source:SchemaTable[],target:SchemaTable[]):TableDifference[]{ const names=new Set([...source.map(x=>x.name),...target.map(x=>x.name)]); return [...names].sort().map((name)=>{const s=source.find(x=>x.name===name),t=target.find(x=>x.name===name);if(!t)return{table:name,status:"missing-target",differences:["Table is missing in target"]};if(!s)return{table:name,status:"target-only",differences:["Table exists only in target"]};const differences:string[]=[];const columns=new Set([...s.columns.map(x=>x.name),...t.columns.map(x=>x.name)]);for(const column of columns){const a=s.columns.find(x=>x.name===column),b=t.columns.find(x=>x.name===column);if(!b){differences.push(`Column ${column} is missing in target`);continue;}if(!a){differences.push(`Column ${column} exists only in target`);continue;}if(a.type!==b.type)differences.push(`${column}: type ${a.type} → ${b.type}`);if(a.nullable!==b.nullable)differences.push(`${column}: nullable ${a.nullable} → ${b.nullable}`);if(a.defaultValue!==b.defaultValue)differences.push(`${column}: default ${a.defaultValue??"NULL"} → ${b.defaultValue??"NULL"}`);if(a.key!==b.key)differences.push(`${column}: key ${a.key||"none"} → ${b.key||"none"}`);if(a.extra!==b.extra)differences.push(`${column}: extra ${a.extra||"none"} → ${b.extra||"none"}`);}return{table:name,status:differences.length?"different":"match",differences};}); }
