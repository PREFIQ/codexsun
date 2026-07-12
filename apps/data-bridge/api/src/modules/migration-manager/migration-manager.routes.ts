import type { FastifyInstance } from "fastify";
import { createDatabaseConnector } from "@codexsun/framework/db";
import { z } from "zod";
import { MigrationManagerRepository } from "./migration-manager.repository.js";

const databaseSchema = z.object({ database: z.string().min(1), host: z.string().min(1), password: z.string().default(""),
  port: z.coerce.number().int().positive(), type: z.enum(["mariadb", "mysql2"]), user: z.string().min(1) });
const jobSchema = z.object({ name: z.string().min(1).max(160), tenant: z.string().min(1).max(160),
  status: z.enum(["draft", "ready", "running", "completed", "failed"]), source: databaseSchema, target: databaseSchema });

export async function registerMigrationManagerRoutes(app: FastifyInstance) {
  const repository = new MigrationManagerRepository();
  await repository.initialize();
  app.get("/data-bridge/migration-jobs", async () => ({ data: await repository.list() }));
  app.get("/data-bridge/migration-jobs/:id", async (request, reply) => {
    const job = await repository.get(Number((request.params as { id: string }).id));
    return job ? { data: job } : reply.code(404).send({ message: "Migration job not found." });
  });
  app.post("/data-bridge/migration-jobs", async (request, reply) => {
    const parsed = jobSchema.safeParse(request.body);
    if (!parsed.success || !parsed.data.source.password || !parsed.data.target.password) return reply.code(400).send({ message: "Complete all required database settings." });
    const duplicate=(await repository.list()).some((job)=>String(job.name).toLowerCase()===parsed.data.name.toLowerCase());
    if(duplicate)return reply.code(409).send({message:"Job name already exists."});
    return reply.code(201).send({ data: await repository.create(parsed.data) });
  });
  app.put("/data-bridge/migration-jobs/:id", async (request, reply) => {
    const parsed = jobSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ message: "Complete all required database settings." });
    const job = await repository.update(Number((request.params as { id: string }).id), parsed.data);
    return job ? { data: job } : reply.code(404).send({ message: "Migration job not found." });
  });
  app.post("/data-bridge/migration-jobs/:id/smoke-test/:side", async (request, reply) => {
    const { id, side } = request.params as { id: string; side: string };
    if (side !== "source" && side !== "target") return reply.code(400).send({ message: "Invalid database side." });
    const job = await repository.secretSettings(Number(id));
    if (!job) return reply.code(404).send({ message: "Migration job not found." });
    const config = job[side];
    const started = Date.now();
    try {
      const connection = await createDatabaseConnector(config).connect({ database: config.database });
      await connection.execute("SELECT 1"); await connection.end();
      return { data: { connected: true, position: `${config.host}:${config.port}/${config.database}`, responseMs: Date.now() - started } };
    } catch { return { data: { connected: false, position: `${config.host}:${config.port}/${config.database}`, responseMs: null } }; }
  });
}
