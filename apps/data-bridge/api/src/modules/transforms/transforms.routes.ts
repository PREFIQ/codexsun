import type { FastifyInstance } from "fastify";
import { dataBridgeJsonStore } from "../../data-bridge-json.store.js";

export async function registerTransformsRoutes(app: FastifyInstance) {
  app.get("/data-bridge/transform-plans", async () => ({
    data: await dataBridgeJsonStore.list("transformPlans")
  }));
  app.get("/data-bridge/transform-plans/:id", async (request, reply) => {
    const plan = await dataBridgeJsonStore.get(
      "transformPlans",
      Number((request.params as { id: string }).id)
    );
    return plan ? { data: plan } : reply.code(404).send({ message: "Transform plan not found." });
  });
  app.put("/data-bridge/transform-plans/:id/approval", async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    const status = String((request.body as { status?: unknown })?.status ?? "");
    if (!["draft", "approved"].includes(status))
      return reply.code(400).send({ message: "Status must be draft or approved." });
    const plan = await dataBridgeJsonStore.update("transformPlans", id, {
      status,
      approvedAt: status === "approved" ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString()
    } as never);
    return plan ? { data: plan } : reply.code(404).send({ message: "Transform plan not found." });
  });
}
