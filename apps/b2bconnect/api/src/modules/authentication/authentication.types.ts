export type B2bConnectRole = "super_admin" | "admin" | "client";

export type B2bConnectRequestIdentity = {
  [header: string]: string | string[] | undefined;
  authorization?: string | string[] | undefined;
};

export type B2bConnectSession = {
  authenticated: true;
  email: string;
  expiresAt: string;
  name: string;
  role: B2bConnectRole;
  sessionIssuedAt: string;
};

export type B2bConnectAuthenticationConfig = {
  deploymentTenantCode: string;
  platformJwtSecret: string;
};
