import { requirePlatformAccess, requireTenantAccess } from "@codexsun/framework/api";
import { AppError } from "@codexsun/framework/errors";
import type {
  B2bConnectAuthenticationConfig,
  B2bConnectRequestIdentity,
  B2bConnectRole,
  B2bConnectSession
} from "./authentication.types.js";

const platformUserType: Record<B2bConnectRole, "staff" | "super_admin" | "tenant"> = {
  admin: "staff",
  client: "tenant",
  super_admin: "super_admin"
};

export class B2bConnectAuthenticationService {
  constructor(private readonly config: B2bConnectAuthenticationConfig) {}

  requireSession(identity: B2bConnectRequestIdentity, allowedRole?: B2bConnectRole) {
    const expectedUserType = allowedRole ? platformUserType[allowedRole] : undefined;
    let claims =
      expectedUserType === "tenant"
        ? requireTenantAccess({
            authorization: identity.authorization,
            secret: this.config.platformJwtSecret,
            tenantDatabase: headerValue(identity["x-tenant-db"]) ?? "",
            tenantId: identity["x-tenant-id"]
          })
        : requirePlatformAccess({
            ...(expectedUserType ? { allowedUserTypes: [expectedUserType] } : {}),
            authorization: identity.authorization,
            secret: this.config.platformJwtSecret
          });

    let role = roleForUserType(claims.userType);
    if (!expectedUserType && role === "client") {
      claims = requireTenantAccess({
        authorization: identity.authorization,
        secret: this.config.platformJwtSecret,
        tenantDatabase: headerValue(identity["x-tenant-db"]) ?? "",
        tenantId: identity["x-tenant-id"]
      });
      role = "client";
    }
    if (!role || (allowedRole && role !== allowedRole)) {
      throw AppError.forbidden("This Platform session cannot access the requested B2B desk.");
    }
    if (
      role === "client" &&
      claims.tenantCode?.trim().toUpperCase() !== this.config.deploymentTenantCode
    ) {
      throw AppError.forbidden(
        "This tenant session belongs to a different application deployment."
      );
    }

    return toSession(claims, role);
  }
}

function roleForUserType(userType: string | undefined): B2bConnectRole | null {
  if (userType === "tenant") return "client";
  if (userType === "staff") return "admin";
  if (userType === "super_admin") return "super_admin";
  return null;
}

function toSession(
  claims: ReturnType<typeof requirePlatformAccess>,
  role: B2bConnectRole
): B2bConnectSession {
  const email = claims.email ?? "";
  return {
    authenticated: true,
    email,
    expiresAt: new Date((claims.exp ?? 0) * 1000).toISOString(),
    name: claims.name?.trim() || email.split("@")[0] || "Platform user",
    role,
    sessionIssuedAt: claims.sessionIssuedAt ?? new Date((claims.exp ?? 0) * 1000).toISOString()
  };
}

function headerValue(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim();
}
