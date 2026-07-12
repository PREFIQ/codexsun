import { dataBridgeJsonStore } from "../../data-bridge-json.store.js";
import type { DatabaseSettings, MigrationJobInput } from "./migration-manager.types.js";

type StoredJob = MigrationJobInput & { id:number; createdAt:string; updatedAt:string };
export class MigrationManagerRepository {
  async initialize() {}
  async list(){return (await dataBridgeJsonStore.list("migrationJobs") as unknown as StoredJob[]).map(publicJob);}
  async get(id:number){const job=await dataBridgeJsonStore.get("migrationJobs",id) as unknown as StoredJob|null;return job?publicJob(job):null;}
  async create(input:MigrationJobInput){const timestamp=new Date().toISOString();const job=await dataBridgeJsonStore.create("migrationJobs",{...input,createdAt:timestamp,updatedAt:timestamp} as never) as unknown as StoredJob;return publicJob(job);}
  async update(id:number,input:MigrationJobInput){const current=await dataBridgeJsonStore.get("migrationJobs",id) as unknown as StoredJob|null;if(!current)return null;const source={...input.source,password:input.source.password||current.source.password};const target={...input.target,password:input.target.password||current.target.password};const job=await dataBridgeJsonStore.update("migrationJobs",id,{...input,source,target,updatedAt:new Date().toISOString()} as never) as unknown as StoredJob|null;return job?publicJob(job):null;}
  async secretSettings(id:number){const job=await dataBridgeJsonStore.get("migrationJobs",id) as unknown as StoredJob|null;return job?{source:job.source,target:job.target}:null;}
}
function publicJob(job:StoredJob){return{...job,source:withoutPassword(job.source),target:withoutPassword(job.target)};}
function withoutPassword(settings:DatabaseSettings){return{...settings,password:""};}
