export type Tenant = {
  corporateId: string | null;
  dbHost: string;
  dbName: string;
  dbPort: number;
  dbSecretRef: string;
  dbType: string;
  dbUser: string;
  enabledModuleKeys: string[];
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
