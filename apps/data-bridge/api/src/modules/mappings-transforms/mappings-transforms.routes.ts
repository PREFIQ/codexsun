import type { FastifyInstance } from "fastify";
import { dataBridgeJsonStore } from "../../data-bridge-json.store.js";
export async function registerMappingsTransformsRoutes(app: FastifyInstance) {
  app.get("/data-bridge/mapping-plans", async () => {
    const plans = await dataBridgeJsonStore.list("mappingPlans");
    const data = await Promise.all(
      plans.map(async (plan) => {
        const snapshot = await dataBridgeJsonStore.get(
          "discoverySnapshots",
          Number(plan.discoverySnapshotId)
        );
        const job = snapshot
          ? await dataBridgeJsonStore.get("migrationJobs", Number(snapshot.migrationJobId))
          : null;
        return {
          ...plan,
          migrationJobId: Number(snapshot?.migrationJobId ?? 0),
          jobName: String(job?.name ?? "")
        };
      })
    );
    return { data };
  });
  app.get("/data-bridge/mapping-plans/:id", async (request, reply) => {
    const plan = await dataBridgeJsonStore.get(
      "mappingPlans",
      Number((request.params as { id: string }).id)
    );
    if (!plan) return reply.code(404).send({ message: "Mapping plan not found." });
    const snapshot = await dataBridgeJsonStore.get(
      "discoverySnapshots",
      Number(plan.discoverySnapshotId)
    );
    const job = snapshot
      ? await dataBridgeJsonStore.get("migrationJobs", Number(snapshot.migrationJobId))
      : null;
    return {
      data: {
        ...plan,
        jobName: String(job?.name ?? ""),
        mappingInput: snapshot?.mappingInput,
        sourceTables: snapshot?.source ?? [],
        targetTables: snapshot?.target ?? []
      }
    };
  });
  app.post("/data-bridge/mapping-plans", async (request, reply) => {
    const body = request.body as { discoverySnapshotId?: number; name?: string };
    const snapshot = await dataBridgeJsonStore.get(
      "discoverySnapshots",
      Number(body.discoverySnapshotId)
    );
    if (!snapshot?.mappingInput)
      return reply
        .code(400)
        .send({ message: "Prepare the Discovery snapshot before creating mappings." });
    const plans = await dataBridgeJsonStore.list("mappingPlans");
    if (plans.some((plan) => Number(plan.discoverySnapshotId) === Number(body.discoverySnapshotId)))
      return reply.code(409).send({ message: "A mapping plan already exists for this snapshot." });
    const timestamp = new Date().toISOString();
    const plan = await dataBridgeJsonStore.create("mappingPlans", {
      discoverySnapshotId: Number(body.discoverySnapshotId),
      name: String(body.name || `Mapping plan #${body.discoverySnapshotId}`),
      status: "draft",
      mappings: [],
      createdAt: timestamp,
      updatedAt: timestamp
    } as never);
    return reply.code(201).send({ data: { id: plan.id } });
  });
  app.put("/data-bridge/mapping-plans/:id", async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    const body = request.body as { name?: string; status?: string; mappings?: unknown };
    if (
      !body.name ||
      !Array.isArray(body.mappings) ||
      !["draft", "ready"].includes(String(body.status))
    )
      return reply.code(400).send({ message: "Valid name, status, and mappings are required." });
    const plan = await dataBridgeJsonStore.update("mappingPlans", id, {
      name: body.name,
      status: body.status,
      mappings: body.mappings,
      updatedAt: new Date().toISOString()
    } as never);
    if (plan)
      await upsertTransformPlan(
        id,
        String(body.name),
        body.mappings as Array<Record<string, unknown>>
      );
    return plan
      ? { data: { saved: true } }
      : reply.code(404).send({ message: "Mapping plan not found." });
  });
  app.delete("/data-bridge/mapping-plans/:id", async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    const deleted = await dataBridgeJsonStore.delete("mappingPlans", id);
    return deleted
      ? { data: { deleted: true, id } }
      : reply.code(404).send({ message: "Field mapping plan not found." });
  });
}

async function upsertTransformPlan(
  mappingPlanId: number,
  name: string,
  mappings: Array<Record<string, unknown>>
) {
  const tables = mappings.map((mapping) => {
    const fields = (Array.isArray(mapping.fields) ? mapping.fields : []).filter(
      (field): field is Record<string, unknown> =>
        typeof field === "object" && field !== null && !field.skipped && Boolean(field.targetColumn)
    );
    const sourceTable = String(mapping.sourceTable ?? "");
    const targetTable = String(mapping.targetTable ?? "");
    const sourceFields = fields.map((field) => String(field.sourceColumn));
    const targetFields = fields.map((field) => String(field.targetColumn));
    return {
      sourceTable,
      targetTable,
      group: String(mapping.group ?? ""),
      fields: fields.map((field) => ({
        sourceField: String(field.sourceColumn),
        targetField: String(field.targetColumn)
      })),
      sourceQuery: `SELECT ${sourceFields.map(identifier).join(", ")} FROM ${identifier(sourceTable)};`,
      targetQuery: `INSERT INTO ${identifier(targetTable)} (${targetFields.map(identifier).join(", ")}) VALUES (${targetFields.map(() => "?").join(", ")});`
    };
  });
  const plans = await dataBridgeJsonStore.list("transformPlans");
  const existing = plans.find((item) => Number(item.mappingPlanId) === mappingPlanId);
  const timestamp = new Date().toISOString();
  const payload = {
    mappingPlanId,
    name: `${name} transforms`,
    status: "draft",
    tables,
    updatedAt: timestamp
  };
  if (existing) await dataBridgeJsonStore.update("transformPlans", existing.id, payload as never);
  else
    await dataBridgeJsonStore.create("transformPlans", {
      ...payload,
      createdAt: timestamp
    } as never);
}
function identifier(value: string) {
  return `\`${value.replace(/`/g, "``")}\``;
}
