import { describe, expect, it } from "vitest";
import { tenantDomainSchema } from "./tenant-domain.schema";

describe("tenant domain form", () => {
  it("normalizes a valid domain", () => {
    expect(tenantDomainSchema.parse({ domain: "HTTPS://Acme.Localhost/path", tenantId: 1 }).domain).toBe("acme.localhost");
  });

  it("rejects an empty tenant selection", () => {
    expect(tenantDomainSchema.safeParse({ domain: "localhost", tenantId: 0 }).success).toBe(false);
  });
});
