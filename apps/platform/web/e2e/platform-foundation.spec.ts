import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment value: ${name}`);
  return value;
}

const apiBaseUrl = requiredEnv("VITE_PLATFORM_API_URL");
const superAdminEmail = process.env.SUPER_ADMIN_EMAIL ?? "sundar@sundar.com";
const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD ?? "Kalarani1";
let superAdminToken = "";

type ApiEnvelope<T> = { data: T; success: true } | { error: { message: string }; success: false };
type PlanAccess = {
  apps: Array<{ appLabel: string; enabled: boolean; moduleKey: string }>;
  planId: number;
  planName: string;
};
type TenantAccessSummary = Array<{
  enabledModuleKeys: string[];
  planModuleKeys: string[];
  tenantCode: string;
}>;
type AccessControlOverview = {
  permissions: unknown[];
  roles: unknown[];
  users: Array<{ email: string; roleKey: string }>;
};
type MasterDatabaseStatus = {
  databaseName: string;
  migrations: unknown[];
  runs: Array<{ operation: string; status: string }>;
  status: "online" | "offline";
  tableCount: number;
  version: string;
};
type TenantDatabaseStatus = Array<{
  databaseName: string;
  migrations: unknown[];
  runs: Array<{ operation: string; status: string }>;
  status: "online" | "offline";
  tenantCode: string;
  tenantId: number;
}>;
type QueueJob = {
  correlationId: string | null;
  id: number;
  jobName: string;
  queueName: string;
  status: "cancelled" | "completed" | "failed" | "pending" | "running";
};

test.beforeEach(async ({ page, request }) => {
  await waitForApi(request);
  await signInSuperAdmin(page, request);
});

test("Super Admin pages render platform-only access areas", async ({ page }) => {
  await page.goto("/sa");
  await expect(page.getByRole("heading", { name: "Platform Dashboard" })).toBeVisible();

  await page.goto("/sa/plan-access");
  await expect(page.getByRole("heading", { name: "Plan Access" })).toBeVisible();
  await expect(page.getByText("Choose which platform apps and modules are included in each plan.")).toBeVisible();

  await page.goto("/sa/tenant-access");
  await expect(page.getByRole("heading", { name: "Tenant Access" })).toBeVisible();
  await expect(page.getByText("Review each tenant subscription, manual grants, and final enabled modules.")).toBeVisible();

  await page.goto("/sa/access");
  await expect(page.getByRole("heading", { name: "Access Control" })).toBeVisible();
  await expect(page.getByText("Manage platform permissions, roles, and platform users.")).toBeVisible();

  await page.goto("/sa/activity");
  await expect(page.getByRole("heading", { name: "Activity" })).toBeVisible();
  await expect(page.getByText("Review recent platform access, subscription, tenant, and setup changes.")).toBeVisible();

  await page.goto("/sa/master-database");
  await expect(page.getByRole("heading", { name: "Master Database" })).toBeVisible();
  await expect(page.getByText("Monitor the platform master database, migration state, backup requests, and restore readiness.")).toBeVisible();

  await page.goto("/sa/tenant-database");
  await expect(page.getByRole("heading", { name: "Tenant Databases" })).toBeVisible();
  await expect(page.getByText("Watch tenant database live status, migration sync, backup requests, and restore readiness.")).toBeVisible();

  await page.goto("/sa/queue-management");
  await expect(page.locator("main h1").filter({ hasText: "Queue Management" })).toBeVisible();
  await expect(page.getByText("Manage database-backed platform jobs now, with the same surface ready for BullMQ and Redis later.")).toBeVisible();
});

test("Plan Access transaction updates Tenant Access and restores starter defaults", async ({ request }) => {
  await savePlanAccess(request, ["platform.application"]);
  let starter = await getPlanAccess(request);
  expect(appEnabled(starter, "platform.application")).toBe(true);
  expect(appEnabled(starter, "billing.sales")).toBe(false);

  await savePlanAccess(request, ["platform.application", "billing.sales"]);
  starter = await getPlanAccess(request);
  expect(appEnabled(starter, "billing.sales")).toBe(true);
  let tenantAccess = await getTenantAccess(request);
  expect(tenantAccess[0]?.tenantCode).toBe("CODEXSUN");
  expect(tenantAccess[0]?.enabledModuleKeys).toContain("billing.sales");
  expect(tenantAccess[0]?.planModuleKeys).toContain("billing.sales");
  const activity = await apiData<Array<{ action: string; moduleKey: string; recordLabel: string }>>(request, "/admin/platform-activity");
  expect(activity.some((item) => item.action === "plan-access.saved" && item.moduleKey === "platform.plan-access" && item.recordLabel === "Starter")).toBe(true);

  await savePlanAccess(request, ["platform.application"]);
  starter = await getPlanAccess(request);
  expect(appEnabled(starter, "billing.sales")).toBe(false);
  tenantAccess = await getTenantAccess(request);
  expect(tenantAccess[0]?.enabledModuleKeys).toEqual(["platform.application"]);
});

test("Access Control transaction creates a platform user", async ({ request }) => {
  const email = `operator.${Date.now()}@example.com`;
  const response = await request.post(`${apiBaseUrl}/admin/access-control/users`, {
    data: {
      email,
      name: "Platform Operator",
      roleKey: "super-admin",
      status: "active"
    }
  });
  expect(response.ok()).toBe(true);

  const access = await apiData<AccessControlOverview>(request, "/admin/access-control");
  expect(access.permissions.length).toBeGreaterThanOrEqual(4);
  expect(access.roles.length).toBeGreaterThanOrEqual(1);
  expect(access.users.some((user) => user.email === email && user.roleKey === "super-admin")).toBe(true);
});

test("Database maintenance queues and executes backup jobs", async ({ request }) => {
  const master = await apiData<MasterDatabaseStatus>(request, "/admin/database/master");
  expect(master.databaseName).toBeTruthy();
  expect(master.status).toBe("online");
  expect(master.tableCount).toBeGreaterThan(0);
  expect(master.migrations.length).toBeGreaterThanOrEqual(1);

  const masterBackup = await request.post(`${apiBaseUrl}/admin/database/master/backup`, {
    data: { note: "e2e master backup request" },
    headers: authHeaders()
  });
  expect(masterBackup.ok()).toBe(true);
  const masterEnvelope = (await masterBackup.json()) as ApiEnvelope<{ id: number }>;
  const masterRun = masterEnvelope.success ? masterEnvelope.data : null;
  expect(masterRun?.id).toBeGreaterThan(0);

  const tenants = await apiData<TenantDatabaseStatus>(request, "/admin/database/tenants");
  const defaultTenant = tenants.find((tenant) => tenant.tenantCode === "CODEXSUN") ?? tenants[0];
  expect(defaultTenant).toBeTruthy();
  expect(defaultTenant.status).toBe("online");
  expect(defaultTenant.migrations.length).toBeGreaterThanOrEqual(1);

  const tenantBackup = await request.post(`${apiBaseUrl}/admin/database/tenants/${defaultTenant.tenantId}/backup`, {
    data: { note: "e2e tenant backup request", tenantId: defaultTenant.tenantId },
    headers: authHeaders()
  });
  expect(tenantBackup.ok()).toBe(true);

  let jobs = await apiData<QueueJob[]>(request, "/admin/queue/jobs");
  const pendingMasterJob = jobs.find((job) => job.correlationId === `database-maintenance:${masterRun?.id}`);
  expect(["pending", "completed"]).toContain(pendingMasterJob?.status);

  if (pendingMasterJob?.status === "pending") {
    const runJob = await request.post(`${apiBaseUrl}/admin/queue/jobs/${pendingMasterJob.id}/run`, { data: {}, headers: authHeaders() });
    expect(runJob.ok()).toBe(true);
  }

  jobs = await apiData<QueueJob[]>(request, "/admin/queue/jobs");
  expect(jobs.find((job) => job.id === pendingMasterJob?.id)?.status).toBe("completed");
  const nextMaster = await apiData<MasterDatabaseStatus>(request, "/admin/database/master");
  expect(nextMaster.runs.some((run) => run.operation === "backup" && run.status === "completed")).toBe(true);

  const masterRestore = await request.post(`${apiBaseUrl}/admin/database/master/restore`, {
    data: { note: "e2e master sandbox restore request" },
    headers: authHeaders()
  });
  expect(masterRestore.ok()).toBe(true);
  const restoreEnvelope = (await masterRestore.json()) as ApiEnvelope<{ id: number }>;
  const restoreRun = restoreEnvelope.success ? restoreEnvelope.data : null;
  expect(restoreRun?.id).toBeGreaterThan(0);

  jobs = await apiData<QueueJob[]>(request, "/admin/queue/jobs");
  const pendingRestoreJob = jobs.find((job) => job.correlationId === `database-maintenance:${restoreRun?.id}`);
  expect(["pending", "completed"]).toContain(pendingRestoreJob?.status);
  if (pendingRestoreJob?.status === "pending") {
    const runRestoreJob = await request.post(`${apiBaseUrl}/admin/queue/jobs/${pendingRestoreJob.id}/run`, { data: {}, headers: authHeaders() });
    expect(runRestoreJob.ok()).toBe(true);
  }

  jobs = await apiData<QueueJob[]>(request, "/admin/queue/jobs");
  expect(jobs.find((job) => job.id === pendingRestoreJob?.id)?.status).toBe("completed");
  const restoredMaster = await apiData<MasterDatabaseStatus>(request, "/admin/database/master");
  expect(restoredMaster.runs.some((run) => run.operation === "restore" && run.status === "completed")).toBe(true);
});

async function signInSuperAdmin(page: Page, request: APIRequestContext) {
  const response = await request.post(`${apiBaseUrl}/auth/login`, {
    data: {
      desk: "sa",
      email: superAdminEmail,
      password: superAdminPassword
    }
  });
  expect(response.ok()).toBe(true);
  const envelope = (await response.json()) as ApiEnvelope<{ accessToken: string }>;
  if (!envelope.success) throw new Error(envelope.error.message);
  superAdminToken = envelope.data.accessToken;
  await page.addInitScript((token) => {
    window.localStorage.setItem("codexsun_session_sa", token);
  }, envelope.data.accessToken);
}

async function waitForApi(request: APIRequestContext) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 60_000) {
    try {
      const response = await request.get(`${apiBaseUrl}/health`);
      if (response.ok()) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("Platform API did not become ready for e2e.");
}

async function getPlanAccess(request: APIRequestContext) {
  return apiData<PlanAccess>(request, "/admin/plans/1/access");
}

async function savePlanAccess(request: APIRequestContext, moduleKeys: string[]) {
  const response = await request.put(`${apiBaseUrl}/admin/plans/1/access`, { data: { moduleKeys } });
  expect(response.ok()).toBe(true);
  return (await response.json()) as ApiEnvelope<PlanAccess>;
}

async function getTenantAccess(request: APIRequestContext) {
  return apiData<TenantAccessSummary>(request, "/admin/tenant-access");
}

async function apiData<T>(request: APIRequestContext, path: string) {
  const response = await request.get(`${apiBaseUrl}${path}`, { headers: authHeaders() });
  expect(response.ok()).toBe(true);
  const envelope = (await response.json()) as ApiEnvelope<T>;
  if (!envelope.success) throw new Error(envelope.error.message);
  return envelope.data;
}

function authHeaders() {
  return superAdminToken ? { Authorization: `Bearer ${superAdminToken}` } : {};
}

function appEnabled(access: PlanAccess, moduleKey: string) {
  return Boolean(access.apps.find((app) => app.moduleKey === moduleKey)?.enabled);
}
