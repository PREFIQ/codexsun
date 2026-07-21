import { createConnection } from "node:net";
import type { OrchestratedApp, OrchestratedService } from "./app-orchestration.types.js";

const platformDefinition = {
  id: "platform",
  label: "Platform",
  description: "The single CODEXSUN runtime with composed Core, Billing, and Mail packages.",
  managed: false,
  services: [
    { id: "api", label: "API", port: 7010 },
    { id: "web", label: "Web", port: 7020 }
  ]
} as const;

export class AppOrchestrationRepository {
  definition(id: string) {
    return id === platformDefinition.id ? platformDefinition : null;
  }

  async list(): Promise<OrchestratedApp[]> {
    const services = await Promise.all(platformDefinition.services.map(probe));
    const online = services.filter((item) => item.online).length;
    return [
      {
        ...platformDefinition,
        lastAction: null,
        services,
        status: online === 0 ? "offline" : online === services.length ? "online" : "partial",
        terminalPid: null,
        uptimeSeconds: null
      }
    ];
  }
}

async function probe(
  input: (typeof platformDefinition.services)[number]
): Promise<OrchestratedService> {
  const started = Date.now();
  const online = await new Promise<boolean>((resolve) => {
    const socket = createConnection({ host: "127.0.0.1", port: input.port });
    socket.setTimeout(700);
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.once("error", () => resolve(false));
  });
  return {
    ...input,
    managedPid: null,
    online,
    responseMs: online ? Date.now() - started : null,
    uptimeSeconds: null
  };
}
