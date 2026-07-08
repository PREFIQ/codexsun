export type Tenant = {
  corporateId: string | null;
  dbHost: string;
  dbName: string;
  dbPort: number;
  dbSecretRef: string;
  dbType: string;
  dbUser: string;
  enabledModuleKeys: string[];
  defaultLandingApp: "application" | "billing";
  id: string;
  mobile: string | null;
  payloadSettings: Record<string, unknown>;
  slug: string;
  tenantCode: string;
  tenantName: string;
  status: "active" | "inactive" | "provisioning" | "suspended" | string;
};

export type TenantSavePayload = {
  corporateId: string | null;
  dbHost: string;
  dbName: string;
  dbPort: number;
  dbSecretRef: string;
  dbType: string;
  dbUser: string;
  enabledModuleKeys: string[];
  defaultLandingApp: "application" | "billing";
  mobile: string | null;
  payloadSettings: Record<string, unknown>;
  slug: string;
  status: string;
  tenantCode: string;
  tenantName: string;
};

export type AuditEventDTO = {
  actor_email?: string | null;
  created_at?: string;
  event_name: string;
  id: number | string;
};

export type TenantRuntime = {
  apps: Array<{
    alwaysEnabled: boolean;
    defaultLanding: boolean;
    description: string;
    enabled: boolean;
    id: "application" | "billing";
    label: string;
    moduleKey: string;
    stack: "platform" | "billing";
  }>;
  defaultLandingApp: "application" | "billing";
  tenant: Tenant | null;
};
