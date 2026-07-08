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
  defaultLandingApp: "application" | "billing";
  id: number;
  mobile: string | null;
  payloadSettings: Record<string, unknown>;
  primaryDomain: string;
  slug: string;
  status: TenantStatus;
  tenantCode: string;
  tenantName: string;
  uuid: string;
};

export type TenantSavePayload = Omit<Tenant, "id" | "primaryDomain" | "uuid"> & {
  primaryDomain?: string;
  uuid?: string;
};

export type TenantAuditEvent = {
  actor_email: string;
  created_at: string;
  event_name: string;
  id: string;
};
