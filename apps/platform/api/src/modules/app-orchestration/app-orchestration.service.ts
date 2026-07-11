import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { AppOrchestrationRepository, type ServiceId } from "./app-orchestration.repository.js";
import type { OrchestratedAppId } from "./app-orchestration.types.js";

const root = resolve(import.meta.dirname, "../../../../../..");
const commands: Record<Exclude<OrchestratedAppId, "platform">, Record<ServiceId, string>> = {
  core: { api: "core-api", web: "core-web" },
  billing: { api: "billing-api", web: "billing-web" },
  accounts: { api: "accounts-api", web: "accounts-web" },
  "data-bridge": { api: "data-bridge-api", web: "data-bridge-web" },
  "kitchen-serve": { api: "kitchen-serve-api", web: "kitchen-serve-web" }
};

export class AppOrchestrationService {
  constructor(private readonly repository = new AppOrchestrationRepository()) {}
  list() {
    return this.repository.list();
  }
  async get(id: string) {
    return (await this.list()).find((item) => item.id === id) ?? null;
  }
  async start(id: OrchestratedAppId) {
    this.requiredManaged(id);
    return Promise.all(
      (["api", "web"] as const).map((serviceId) => this.startService(id, serviceId))
    );
  }
  stop(id: OrchestratedAppId) {
    this.requiredManaged(id);
    return {
      stopped: (["api", "web"] as const)
        .map((serviceId) => this.stopService(id, serviceId, true))
        .some(Boolean)
    };
  }
  update(id: OrchestratedAppId) {
    const definition = this.requiredManaged(id);
    const command = `npm.cmd install && npm.cmd run typecheck -w @codexsun/${id}-api && npm.cmd run typecheck -w @codexsun/${id}-web`;
    const pid = openTerminal(command, `Update ${definition.label}`);
    this.repository.recordAction(id, "update-opened");
    return { pid, opened: true };
  }
  async startService(id: OrchestratedAppId, serviceId: ServiceId) {
    const definition = this.requiredManaged(id);
    this.requiredService(definition, serviceId);
    const runtime = this.repository.serviceRuntime(id, serviceId);
    if (runtime) return runtime;
    const current = await this.get(id);
    const service = current?.services.find((item) => item.id === serviceId);
    if (service?.online)
      throw new Error(
        `${definition.label} ${service.label} is already online outside this orchestrator.`
      );
    const command = `node tools/preflight.mjs ${commands[id as Exclude<OrchestratedAppId, "platform">][serviceId]}`;
    const pid = openTerminal(command, `CODEXSUN ${definition.label} ${serviceId.toUpperCase()}`);
    this.repository.recordServiceStart(id, serviceId, pid);
    return this.repository.serviceRuntime(id, serviceId);
  }
  stopService(id: OrchestratedAppId, serviceId: ServiceId, allowMissing = false) {
    const definition = this.requiredManaged(id);
    this.requiredService(definition, serviceId);
    const runtime = this.repository.serviceRuntime(id, serviceId);
    if (!runtime) {
      if (allowMissing) return false;
      throw new Error("This service was not started by the orchestrator.");
    }
    killTree(runtime.pid);
    this.repository.clearService(id, serviceId);
    return true;
  }
  async restartService(id: OrchestratedAppId, serviceId: ServiceId) {
    this.stopService(id, serviceId);
    return this.startService(id, serviceId);
  }
  private requiredManaged(id: OrchestratedAppId) {
    const definition = this.repository.definition(id);
    if (!definition) throw new Error("Unknown repository app.");
    if (!definition.managed) throw new Error("Platform cannot manage its own process lifecycle.");
    return definition;
  }
  private requiredService(
    definition: NonNullable<ReturnType<AppOrchestrationRepository["definition"]>>,
    serviceId: string
  ) {
    if (!definition.services.some((item) => item.id === serviceId))
      throw new Error("Unknown app service.");
  }
}

function killTree(pid: number) {
  if (process.platform === "win32")
    execFileSync("taskkill", ["/PID", String(pid), "/T", "/F"], { stdio: "ignore" });
  else process.kill(pid, "SIGTERM");
}
function openTerminal(command: string, title: string) {
  if (process.platform === "win32") {
    const encodedCommand = terminalPayload(command, title);
    const script = `$p=Start-Process -FilePath powershell.exe -ArgumentList '-NoExit','-EncodedCommand','${encodedCommand}' -PassThru; $p.Id`;
    return Number(
      execFileSync("powershell.exe", ["-NoProfile", "-Command", script], {
        encoding: "utf8"
      }).trim()
    );
  }
  throw new Error("Visible terminal orchestration is currently implemented for Windows only.");
}
export function terminalPayload(command: string, title: string) {
  const terminalScript = `$Host.UI.RawUI.WindowTitle = '${title.replaceAll("'", "''")}'; Set-Location -LiteralPath '${root.replaceAll("'", "''")}'; ${command}`;
  return Buffer.from(terminalScript, "utf16le").toString("base64");
}
