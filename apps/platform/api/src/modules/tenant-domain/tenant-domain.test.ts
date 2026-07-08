import { describe, expect, it } from "vitest";
import { createTenantDomainEvent, tenantDomainEvents } from "./tenant-domain.events.js";
import { normalizeTenantDomain } from "./tenant-domain.repository.js";
import { resolveTenantDomainSync } from "./tenant-domain.sync.js";

describe("tenant domain module contract", () => {
  it("normalizes public hostnames", () => {
    expect(normalizeTenantDomain("https://Acme.Localhost/path")).toBe("acme.localhost");
  });

  it("builds tenant-scoped events", () => {
    const event = createTenantDomainEvent(
      tenantDomainEvents.created,
      { domain: "localhost", tenantId: 1, uuid: "abcd1234" },
      "request-1"
    );
    expect(event.tenantId).toBe(1);
  });

  it("keeps server domain state authoritative", () => {
    expect(resolveTenantDomainSync(null, "2026-07-08T00:00:00.000Z")).toBe("pull");
  });
});
