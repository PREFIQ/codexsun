import type { FastifyInstance } from "fastify";
import { ok } from "@codexsun/framework/http";
import { CommonService } from "./common.service.js";
import { locationModule } from "./location/location.module.js";
import { commonMasterDefinitions } from "./common-master.registry.js";
import { createCommonMasterRoutes } from "./foundation/common-master.routes.js";

const commonService = new CommonService();

export async function registerCommonRoutes(app: FastifyInstance) {
  app.get("/core/common", async (request) => ok(commonService.listAreas(), { requestId: request.id }));
  await locationModule.register(app);
  for (const definition of commonMasterDefinitions) {
    await createCommonMasterRoutes(definition)(app);
  }
}
