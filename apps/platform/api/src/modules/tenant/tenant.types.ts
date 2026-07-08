export type TenantStatus = "active" | "inactive" | "provisioning" | "suspended";

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
  status: TenantStatus;
  tenantCode: string;
  tenantName: string;
};

export type TenantSavePayload = Omit<Tenant, "id">;

export type TenantAuditEvent = {
  actor_email: string;
  created_at: string;
  event_name: string;
  id: string;
};
