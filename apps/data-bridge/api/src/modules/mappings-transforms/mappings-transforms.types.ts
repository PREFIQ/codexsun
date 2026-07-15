export type MappingField = {
  sourceColumn: string;
  targetColumn: string;
  skipped?: boolean | undefined;
};

export type MappingTable = {
  sourceTable: string;
  targetTable: string;
  group?: string | undefined;
  fields: MappingField[];
};

export type MappingPlan = {
  id: number;
  discoverySnapshotId: number;
  name: string;
  status: "draft" | "ready";
  mappings: MappingTable[];
  createdAt: string;
  updatedAt: string;
};

export type MappingPlanContext = {
  plan: MappingPlan;
  snapshot: {
    id: number;
    migrationJobId: number;
    jobName: string;
    source: SchemaTable[];
    target: SchemaTable[];
    mappingInput: unknown | null;
  };
};
import type { SchemaTable } from "../discovery-snapshots/index.js";
