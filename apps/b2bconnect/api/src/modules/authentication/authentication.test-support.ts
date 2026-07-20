import { createHmac } from "node:crypto";

export const platformTestSecret = "test-secret-with-sufficient-entropy";

export function platformTestIdentity(
  userType: "staff" | "super_admin" | "tenant",
  input?: {
    tenantCode?: string;
    tenantDbName?: string;
    tenantId?: string;
  }
) {
  const now = Math.floor(Date.now() / 1000);
  const tenant = userType === "tenant";
  const payload = {
    aud: "codexsun-platform",
    email: `${userType}@example.test`,
    exp: now + 3600,
    iat: now,
    iss: "codexsun-platform-api",
    jti: `test-${userType}`,
    name: userType === "tenant" ? "Client" : userType === "staff" ? "Admin" : "Root",
    sessionIssuedAt: new Date(now * 1000).toISOString(),
    ...(tenant
      ? {
          tenantCode: input?.tenantCode ?? "B2BCONNECT",
          tenantDbName: input?.tenantDbName ?? "tenant_b2bconnect",
          tenantId: input?.tenantId ?? "tenant-b2bconnect"
        }
      : {}),
    userId: `user-${userType}`,
    userType
  };
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", platformTestSecret)
    .update(`${header}.${body}`)
    .digest("base64url");
  const accessToken = `${header}.${body}.${signature}`;
  return {
    accessToken,
    headers: {
      authorization: `Bearer ${accessToken}`,
      ...(tenant
        ? {
            "x-tenant-db": payload.tenantDbName,
            "x-tenant-id": payload.tenantId
          }
        : {})
    }
  };
}
