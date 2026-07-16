import { createHash } from "node:crypto";
import { createDatabaseConnector, type CompatibleDbConnection } from "@codexsun/framework/db";
import { AppError } from "@codexsun/framework/errors";
import { getMigrationJobSecrets } from "../migration-manager/index.js";
import type { SchemaTable } from "../discovery-snapshots/index.js";
import type { MappingPlanContext } from "../mappings-transforms/index.js";
import type { TransformPlan } from "../transforms/index.js";
import type {
  ReviewApproval,
  ReviewRecordPreview,
  ReviewTableEvidence
} from "./review-approvals.types.js";

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

export async function previewReviewRecords(
  review: ReviewApproval,
  transform: TransformPlan,
  targetTable: string,
  limit: number
): Promise<ReviewRecordPreview> {
  const table = transform.tables.find((item) => item.targetTable === targetTable);
  if (!table) throw AppError.notFound("The reviewed table mapping was not found.");
  const evidence = review.tables.find((item) => item.targetTable === targetTable);
  if (!evidence) throw AppError.notFound("The reviewed table evidence was not found.");
  const secrets = await getMigrationJobSecrets(review.migrationJobId);
  if (!secrets) throw AppError.notFound("Migration connection settings were not found.");
  const source = await createDatabaseConnector(toConnector(secrets.source)).connect({
    database: secrets.source.database
  });
  const target = await createDatabaseConnector(toConnector(secrets.target)).connect({
    database: secrets.target.database
  });
  try {
    const sourceSql = table.sourceQuery.trim().replace(/;$/, "");
    const [sourceRows] = await source.execute<Record<string, unknown>[]>(`${sourceSql} LIMIT ?`, [
      limit
    ]);
    const generatedIdentityFields = await findGeneratedIdentityFields(
      target,
      table.targetTable,
      evidence.identityFields
    );
    const rows = [];
    for (const sourceRow of sourceRows) {
      const sourceValues = Object.fromEntries(
        table.fields.map((field) => [field.sourceField, sourceRow[field.sourceField] ?? null])
      );
      const mappedValues = Object.fromEntries(
        table.fields.map((field) => [field.targetField, sourceRow[field.sourceField] ?? null])
      );
      const identityValues = Object.fromEntries(
        evidence.identityFields.map((field) => [field, mappedValues[field]])
      );
      const invalid = Object.values(identityValues).some(
        (value) => value === null || value === undefined
      );
      const identityTargetValues = invalid
        ? null
        : await findTargetRecord(target, table.targetTable, table.fields, identityValues);
      const matchingTargetValues = invalid
        ? null
        : identityTargetValues !== null &&
            mappedRecordsMatch(mappedValues, identityTargetValues, evidence.identityFields)
          ? identityTargetValues
          : await findMappedRecord(
              target,
              table.targetTable,
              table.fields,
              mappedValues,
              evidence.identityFields
            );
      const targetValues = matchingTargetValues ?? identityTargetValues;
      const status = invalid
        ? ("invalid" as const)
        : matchingTargetValues !== null
          ? ("match" as const)
          : identityTargetValues !== null
            ? ("different" as const)
            : ("new" as const);
      rows.push({
        key: createHash("sha256")
          .update(`${table.targetTable}:${JSON.stringify(identityValues)}`)
          .digest("hex")
          .slice(0, 16),
        identityValues,
        sourceValues,
        mappedValues,
        targetValues,
        status,
        targetIdentityMode:
          status === "new"
            ? ("preserve" as const)
            : status === "different" &&
                generatedIdentityFields.length === evidence.identityFields.length
              ? ("generate" as const)
              : null
      });
    }
    return {
      sourceTable: table.sourceTable,
      targetTable: table.targetTable,
      sourceFields: table.fields.map((field) => field.sourceField),
      targetFields: table.fields.map((field) => field.targetField),
      rows
    };
  } finally {
    await Promise.allSettled([source.end(), target.end()]);
  }
}

async function findGeneratedIdentityFields(
  connection: CompatibleDbConnection,
  table: string,
  identityFields: string[]
) {
  const [rows] = await connection.execute<Array<Record<string, unknown>>>(
    "SELECT COLUMN_NAME AS column_name, EXTRA AS extra FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=?",
    [table]
  );
  return identityFields.filter((field) =>
    rows.some(
      (row) =>
        String(row.column_name ?? "") === field &&
        String(row.extra ?? "")
          .toLowerCase()
          .includes("auto_increment")
    )
  );
}

function mappedRecordsMatch(
  mappedValues: Record<string, unknown>,
  targetValues: Record<string, unknown>,
  identityFields: string[]
) {
  const identities = new Set(identityFields);
  return Object.entries(mappedValues)
    .filter(([field]) => !identities.has(field))
    .every(([field, value]) => mappedValuesEqual(field, value, targetValues[field]));
}

function mappedValuesEqual(field: string, source: unknown, target: unknown) {
  if (source === target) return true;
  if (source === null || source === undefined || target === null || target === undefined)
    return false;
  if (/^(status|is_active|active)$/i.test(field))
    return normalizedStatus(source) === normalizedStatus(target);
  return String(source).trim() === String(target).trim();
}

function normalizedStatus(value: unknown) {
  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "active", "enabled"].includes(normalized)) return "active";
  if (["0", "false", "no", "inactive", "disabled"].includes(normalized)) return "inactive";
  return normalized;
}

async function findTargetRecord(
  connection: CompatibleDbConnection,
  table: string,
  fields: Array<{ targetField: string }>,
  identityValues: Record<string, unknown>
) {
  const selectedFields = Array.from(new Set(fields.map((field) => field.targetField)));
  const where = Object.keys(identityValues)
    .map((field) => `${identifier(field)}=?`)
    .join(" AND ");
  const [rows] = await connection.execute<Record<string, unknown>[]>(
    `SELECT ${selectedFields.map(identifier).join(", ")} FROM ${identifier(table)} WHERE ${where} LIMIT 1`,
    Object.values(identityValues)
  );
  return rows[0] ?? null;
}

async function findMappedRecord(
  connection: CompatibleDbConnection,
  table: string,
  fields: Array<{ targetField: string }>,
  mappedValues: Record<string, unknown>,
  identityFields: string[]
) {
  const identities = new Set(identityFields);
  const selectedFields = Array.from(new Set(fields.map((field) => field.targetField)));
  const comparableFields = selectedFields.filter((field) => !identities.has(field));
  if (!comparableFields.length) return null;
  const values: unknown[] = [];
  const predicates = comparableFields.map((field) => {
    const value = mappedValues[field];
    if (value === null || value === undefined) return `${identifier(field)} IS NULL`;
    if (/^(status|is_active|active)$/i.test(field)) {
      const status = normalizedStatus(value);
      const equivalents =
        status === "active"
          ? ["1", "true", "yes", "active", "enabled"]
          : status === "inactive"
            ? ["0", "false", "no", "inactive", "disabled"]
            : [status];
      values.push(...equivalents);
      return `LOWER(TRIM(CAST(${identifier(field)} AS CHAR))) IN (${equivalents.map(() => "?").join(", ")})`;
    }
    values.push(String(value).trim().toLowerCase());
    return `LOWER(TRIM(CAST(${identifier(field)} AS CHAR)))=?`;
  });
  const [rows] = await connection.execute<Record<string, unknown>[]>(
    `SELECT ${selectedFields.map(identifier).join(", ")} FROM ${identifier(table)} WHERE ${predicates.join(" AND ")} LIMIT 1`,
    values
  );
  return rows[0] ?? null;
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
