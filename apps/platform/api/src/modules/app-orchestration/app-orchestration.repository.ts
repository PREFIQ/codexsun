import { createConnection } from "node:net";
import type {
  OrchestratedApp,
  OrchestratedAppId,
  OrchestratedService
} from "./app-orchestration.types.js";

export const appDefinitions = [
  {
    id: "platform",
    label: "Platform",
    description: "Identity, tenants, governance, and Super Admin.",
    managed: false,
    services: [service("api", "API", 7010), service("web", "Web", 7020)]
  },
  {
    id: "core",
    label: "Core",
    description: "Shared masters, organisation, contacts, and products.",
    managed: true,
    services: [service("api", "API", 7030), service("web", "Web", 7040)]
  },
  {
    id: "billing",
    label: "Billing",
    description: "Quotations, sales, purchase, payment, and receipt.",
    managed: true,
    services: [service("api", "API", 7050), service("web", "Web", 7060)]
  },
  {
    id: "data-bridge",
    label: "Data Bridge",
    description: "Schema comparison and controlled data migration.",
    managed: true,
    services: [service("api", "API", 7090), service("web", "Web", 7100)]
  },
  {
    id: "kitchen-serve",
    label: "KitchenServe",
    description: "Waiter, kitchen, serving, and bill-waiting operations.",
    managed: true,
    services: [service("api", "API", 7110), service("web", "Web", 7120)]
  }
] as const;

export type ServiceId = "api" | "web";
type Runtime = { pid: number; startedAt: number; lastAction: string };
const serviceRuntimes = new Map<string, Runtime>();
const appActions = new Map<OrchestratedAppId, string>();

export class AppOrchestrationRepository {
  serviceRuntime(appId: OrchestratedAppId, serviceId: ServiceId) {
    return serviceRuntimes.get(runtimeKey(appId, serviceId)) ?? null;
  }
  recordServiceStart(appId: OrchestratedAppId, serviceId: ServiceId, pid: number) {
    serviceRuntimes.set(runtimeKey(appId, serviceId), {
      pid,
      startedAt: Date.now(),
      lastAction: "started"
    });
    appActions.set(appId, `${serviceId}-started`);
  }
  recordAction(appId: OrchestratedAppId, action: string) {
    appActions.set(appId, action);
  }
  clearService(appId: OrchestratedAppId, serviceId: ServiceId) {
    serviceRuntimes.delete(runtimeKey(appId, serviceId));
    appActions.set(appId, `${serviceId}-stopped`);
  }
  definition(id: string) {
    return appDefinitions.find((item) => item.id === id) ?? null;
  }
  async list(): Promise<OrchestratedApp[]> {
    return Promise.all(
      appDefinitions.map(async (definition) => {
        const services = await Promise.all(
          definition.services.map((item) =>
            probe(item, this.serviceRuntime(definition.id, item.id))
          )
        );
        const online = services.filter((item) => item.online).length;
        const managed = services.filter((item) => item.managedPid !== null);
        const uptimes = managed.flatMap((item) =>
          item.uptimeSeconds === null ? [] : [item.uptimeSeconds]
        );
        return {
          id: definition.id,
          label: definition.label,
          description: definition.description,
          managed: definition.managed,
          services,
          status: online === 0 ? "offline" : online === services.length ? "online" : "partial",
          terminalPid: managed[0]?.managedPid ?? null,
          uptimeSeconds: uptimes.length ? Math.min(...uptimes) : null,
          lastAction: appActions.get(definition.id) ?? null
        };
      })
    );
  }
}

function runtimeKey(appId: OrchestratedAppId, serviceId: ServiceId) {
  return `${appId}:${serviceId}`;
}
function service(id: ServiceId, label: string, port: number) {
  return { id, label, port };
}
async function probe(
  input: { id: ServiceId; label: string; port: number },
  runtime: Runtime | null
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
    online,
    responseMs: online ? Date.now() - started : null,
    managedPid: runtime?.pid ?? null,
    uptimeSeconds: runtime ? Math.floor((Date.now() - runtime.startedAt) / 1000) : null
  };
}
