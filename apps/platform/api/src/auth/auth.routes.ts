import type { FastifyInstance } from "fastify";
import { ok } from "@codexsun/framework/http";

const developmentUsers = {
  admin: {
    email: "admin@codexsun.app",
    name: "Staff Admin",
    userType: "staff"
  },
  sa: {
    email: "superadmin@codexsun.app",
    name: "Super Admin",
    userType: "super_admin"
  },
  tenant: {
    email: "user@codexsun.app",
    name: "Tenant Admin",
    userType: "tenant"
  }
} as const;

type Desk = keyof typeof developmentUsers;

function isDesk(value: unknown): value is Desk {
  return value === "sa" || value === "admin" || value === "tenant";
}

function base64Url(input: string) {
  return Buffer.from(input).toString("base64url");
}

function createDevToken(payload: Record<string, unknown>) {
  const now = Math.floor(Date.now() / 1000);
  return [
    base64Url(JSON.stringify({ alg: "none", typ: "JWT" })),
    base64Url(JSON.stringify({ ...payload, exp: now + 60 * 60 * 8, iat: now })),
    "dev"
  ].join(".");
}

export async function registerAuthRoutes(app: FastifyInstance) {
  app.post("/auth/login", async (request) => {
    const body = request.body as { desk?: unknown; email?: string; tenantCode?: string } | undefined;
    const desk = isDesk(body?.desk) ? body.desk : "tenant";
    const user = developmentUsers[desk];
    const tenantCode = desk === "tenant" ? body?.tenantCode?.trim() || undefined : undefined;
    const tenantId = tenantCode ? `tenant-${tenantCode.toLowerCase()}` : undefined;
    const meta = tenantId ? { requestId: request.id, tenantId } : { requestId: request.id };

    return ok(
      {
        accessToken: createDevToken({
          email: body?.email || user.email,
          tenantCode,
          tenantId,
          userType: user.userType
        }),
        email: body?.email || user.email,
        tenantCode,
        tenantId,
        userType: user.userType
      },
      meta
    );
  });

  app.get("/auth/session", async (request) =>
    ok(
      {
        authenticated: true,
        tenantId: request.headers["x-tenant-id"]
      },
      {
        requestId: request.id,
        ...(request.headers["x-tenant-id"] ? { tenantId: String(request.headers["x-tenant-id"]) } : {})
      }
    )
  );

  app.post("/auth/logout", async (request) => ok({ loggedOut: true }, { requestId: request.id }));
}
