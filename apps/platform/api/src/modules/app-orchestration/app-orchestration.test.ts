import { describe, expect, it } from "vitest";
import { appDefinitions } from "./app-orchestration.repository.js";
import { terminalPayload } from "./app-orchestration.service.js";
describe("app orchestration", () => {
  it("keeps platform self-management disabled", () =>
    expect(appDefinitions.find((item) => item.id === "platform")?.managed).toBe(false));
  it("allocates unique service ports", () => {
    const ports = appDefinitions.flatMap((item) => item.services.map((service) => service.port));
    expect(new Set(ports).size).toBe(ports.length);
  });
  it("defines individually addressable API and web services", () => {
    expect(
      appDefinitions.find((item) => item.id === "kitchen-serve")?.services.map((item) => item.id)
    ).toEqual(["api", "web"]);
  });
  it("preserves terminal titles with spaces through PowerShell encoding", () => {
    const decoded = Buffer.from(
      terminalPayload("node --version", "CODEXSUN KitchenServe"),
      "base64"
    ).toString("utf16le");
    expect(decoded).toContain("WindowTitle = 'CODEXSUN KitchenServe'");
    expect(decoded).toContain("node --version");
  });
});
