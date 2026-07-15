import { createDatabaseConnector } from "@codexsun/framework/db";
import { AppError } from "@codexsun/framework/errors";
import { getMigrationJobSecrets } from "../migration-manager/index.js";
import type { SchemaTable } from "../discovery-snapshots/index.js";
import type { MappingPlanContext } from "../mappings-transforms/index.js";
import type { TransformPlan } from "../transforms/index.js";
import type { ReviewTableEvidence } from "./review-approvals.types.js";

type CountRow = Record<string, unknown>;

export async function processReviewDryRun(
  transform: TransformPlan,
  context: MappingPlanContext
): Promise<ReviewTableEvidence[]> {
  const secrets = await getMigrationJobSecrets(context.snapshot.migrationJobId);
  if (!secrets) throw AppError.notFound("Migration connection settings were not found.");
  const source = await createDatabaseConnector(toConnector(secrets.source)).connect({
    database: secrets.source.database
  });
  const target = await createDatabaseConnector(toConnector(secrets.target)).connect({
    database: secrets.target.database
  });
  try {
    const targetTables = (context.snapshot.target ?? []) as SchemaTable[];
    const evidence: ReviewTableEvidence[] = [];
    for (const table of transform.tables) {
      const targetSchema = targetTables.find((item) => item.name === table.targetTable);
      const mappedTargets = new Set(table.fields.map((field) => field.targetField));
      const primaryFields = (targetSchema?.columns ?? [])
        .filter((column) => column.key === "PRI")
        .map((column) => column.name);
      const uniqueField = (targetSchema?.columns ?? []).find(
        (column) => column.key === "UNI"
      )?.name;
      const expectedIdentityFields = primaryFields.length
        ? primaryFields
        : uniqueField
          ? [uniqueField]
          : [];
      const identityFields = expectedIdentityFields.filter((column) => mappedTargets.has(column));
      const blockingRisks: string[] = [];
      if (!table.fields.length) blockingRisks.push("No fields are mapped.");
      if (!targetSchema)
        blockingRisks.push("Target table is not present in the discovery snapshot.");
      if (!expectedIdentityFields.length)
        blockingRisks.push("Target table has no primary or unique identity field for idempotency.");
      else if (identityFields.length !== expectedIdentityFields.length)
        blockingRisks.push("The complete target primary or unique identity is not mapped.");
      const [sourceRows] = await source.execute<CountRow[]>(
        `SELECT COUNT(*) AS row_count FROM ${identifier(table.sourceTable)}`
      );
      const [targetRows] = await target.execute<CountRow[]>(
        `SELECT COUNT(*) AS row_count FROM ${identifier(table.targetTable)}`
      );
      evidence.push({
        sourceTable: table.sourceTable,
        targetTable: table.targetTable,
        mappedFieldCount: table.fields.length,
        identityFields,
        sourceCount: countValue(sourceRows),
        targetCount: countValue(targetRows),
        blockingRisks,
        warnings:
          countValue(targetRows) > 0
            ? ["Target already contains records; every matching identity will stop this table."]
            : []
      });
    }
    return evidence;
  } finally {
    await Promise.allSettled([source.end(), target.end()]);
  }
}

function toConnector(settings: {
  type: "mariadb" | "mysql2";
  host: string;
  password: string;
  port: number;
  user: string;
}) {
  return { ...settings, driver: settings.type };
}

function identifier(value: string) {
  return `\`${value.replace(/`/g, "``")}\``;
}

function countValue(rows: CountRow[]) {
  const first = rows[0] ?? {};
  return Number(first.row_count ?? first.ROW_COUNT ?? Object.values(first)[0] ?? 0);
}
