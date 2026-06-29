import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { createApp } from "../app.js";
import { hashPassword } from "@codexsun/platform/auth";

describe("Admin Endpoints", () => {
  let app: FastifyInstance;
  let saToken: string;

  beforeAll(async () => {
    app = await createApp();
    await app.ready();

    const hash = hashPassword("test-sa-pass", "codexsun-super-admin");
    await app.masterDbPool.execute(
      `INSERT INTO super_admin_users (display_name, email, password_hash)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
      ["Test SA Admin", "test-admin-sa@codexsun.com", hash]
    );

    const loginRes = await app.inject({
      method: "POST",
      url: "/auth/login",
      body: { desk: "sa", email: "test-admin-sa@codexsun.com", password: "test-sa-pass" }
    });
    saToken = JSON.parse(loginRes.body).data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  // ── Console Dashboard ──────────────────────────────────────────
  it("GET /admin/console returns dashboard stats", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/admin/console",
      headers: { Authorization: `Bearer ${saToken}` }
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.data.tenants).toBeDefined();
    expect(typeof body.data.enabledModules).toBe("number");
    expect(typeof body.data.recentAudits).toBe("number");
  });

  it("GET /admin/console rejects non-super-admin", async () => {
    const res = await app.inject({ method: "GET", url: "/admin/console" });
    expect(res.statusCode).toBe(401);
  });

  // ── Tenant Registry ────────────────────────────────────────────
  it("GET /admin/tenants lists tenants", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/admin/tenants",
      headers: { Authorization: `Bearer ${saToken}` }
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it("POST /admin/tenants creates a tenant", async () => {
    const code = "test-" + Date.now();
    const res = await app.inject({
      method: "POST",
      url: "/admin/tenants",
      headers: { Authorization: `Bearer ${saToken}` },
      body: { tenantCode: code, tenantName: "Admin Test Tenant" }
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.tenantCode).toBe(code.toLowerCase());
  });

  it("POST /admin/tenants/:id/suspend suspends a tenant", async () => {
    const listRes = await app.inject({
      method: "GET",
      url: "/admin/tenants",
      headers: { Authorization: `Bearer ${saToken}` }
    });
    const tenants = JSON.parse(listRes.body).data;
    const tenant = tenants.find((t: { tenantCode: string }) => t.tenantCode.startsWith("test-"));
    const res = await app.inject({
      method: "POST",
      url: `/admin/tenants/${tenant.id}/suspend`,
      headers: { Authorization: `Bearer ${saToken}` }
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.status).toBe("suspended");
  });

  it("POST /admin/tenants/:id/restore restores a tenant", async () => {
    const listRes = await app.inject({
      method: "GET",
      url: "/admin/tenants",
      headers: { Authorization: `Bearer ${saToken}` }
    });
    const tenants = JSON.parse(listRes.body).data;
    const tenant = tenants.find((t: { status: string }) => t.status === "suspended");
    const res = await app.inject({
      method: "POST",
      url: `/admin/tenants/${tenant.id}/restore`,
      headers: { Authorization: `Bearer ${saToken}` }
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.status).toBe("active");
  });

  // ── Module Activation ──────────────────────────────────────────
  it("GET /admin/modules/catalog returns module catalog", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/admin/modules/catalog",
      headers: { Authorization: `Bearer ${saToken}` }
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  it("POST /admin/modules/tenant/:tenantId/enable enables a module", async () => {
    const listRes = await app.inject({
      method: "GET",
      url: "/admin/tenants",
      headers: { Authorization: `Bearer ${saToken}` }
    });
    const tenants = JSON.parse(listRes.body).data;
    const testTenant = tenants.find((t: { tenantCode: string }) => t.tenantCode.startsWith("test-"));
    const res = await app.inject({
      method: "POST",
      url: `/admin/modules/tenant/${testTenant.id}/enable`,
      headers: { Authorization: `Bearer ${saToken}` },
      body: { moduleKey: "platform.audit" }
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.enabled).toBe(true);
  });

  // ── Audit Viewer ───────────────────────────────────────────────
  it("GET /admin/audit returns audit events", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/admin/audit",
      headers: { Authorization: `Bearer ${saToken}` }
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it("GET /admin/audit filters by event name", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/admin/audit?eventName=tenant.created",
      headers: { Authorization: `Bearer ${saToken}` }
    });
    expect(res.statusCode).toBe(200);
  });

  it("GET /admin/audit/actors returns actor list", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/admin/audit/actors",
      headers: { Authorization: `Bearer ${saToken}` }
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body.data)).toBe(true);
  });

  // ── Migration Status ───────────────────────────────────────────
  it("GET /admin/migrations returns migration records", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/admin/migrations",
      headers: { Authorization: `Bearer ${saToken}` }
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body.data)).toBe(true);
  });

  // ── System Health ──────────────────────────────────────────────
  it("GET /admin/health returns health status", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/admin/health",
      headers: { Authorization: `Bearer ${saToken}` }
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.api).toBeDefined();
    expect(body.data.database).toBeDefined();
    expect(body.data.modules).toBeDefined();
  });

  // ── Platform Users ─────────────────────────────────────────────
  it("GET /admin/users/:userType lists users", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/admin/users/super_admin",
      headers: { Authorization: `Bearer ${saToken}` }
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it("POST /admin/users creates a new user", async () => {
    const email = `new-user-${Date.now()}@codexsun.com`;
    const res = await app.inject({
      method: "POST",
      url: "/admin/users",
      headers: { Authorization: `Bearer ${saToken}` },
      body: { displayName: "New User", email, password: "test-pass-123", userType: "staff" }
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.email).toBe(email);
    expect(body.data.userType).toBe("staff");
  });

  it("POST /admin/users rejects duplicate email", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/admin/users",
      headers: { Authorization: `Bearer ${saToken}` },
      body: { displayName: "Duplicate", email: "test-admin-sa@codexsun.com", password: "test", userType: "super_admin" }
    });
    expect(res.statusCode).toBe(409);
  });

  it("POST /admin/users/:userType/:id/suspend suspends a user", async () => {
    const listRes = await app.inject({
      method: "GET",
      url: "/admin/users/super_admin",
      headers: { Authorization: `Bearer ${saToken}` }
    });
    const users = JSON.parse(listRes.body).data;
    const target = users.find((u: { email: string }) => u.email === "test-admin-sa@codexsun.com");
    const res = await app.inject({
      method: "POST",
      url: `/admin/users/super_admin/${target.id}/suspend`,
      headers: { Authorization: `Bearer ${saToken}` }
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.suspended).toBe(true);

    // Reactivate for other tests
    await app.inject({
      method: "POST",
      url: `/admin/users/super_admin/${target.id}/activate`,
      headers: { Authorization: `Bearer ${saToken}` }
    });
  });

  // ── Roles ──────────────────────────────────────────────────────
  it("GET /admin/roles returns seeded system roles", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/admin/roles",
      headers: { Authorization: `Bearer ${saToken}` }
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  it("GET /admin/roles/system returns system role definitions", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/admin/roles/system",
      headers: { Authorization: `Bearer ${saToken}` }
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  it("POST /admin/roles creates a custom role", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/admin/roles",
      headers: { Authorization: `Bearer ${saToken}` },
      body: { key: "test-role", label: "Test Role", description: "A test role", userType: "staff", permissions: [] }
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.key).toBe("test-role");
  });

  // ── Permission Matrix ──────────────────────────────────────────
  it("GET /admin/permissions/matrix returns permission matrix", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/admin/permissions/matrix",
      headers: { Authorization: `Bearer ${saToken}` }
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.matrix).toBeDefined();
    expect(body.data.allPermissions).toBeDefined();
    expect(body.data.matrix.length).toBeGreaterThan(0);
  });

  // ── Sessions ───────────────────────────────────────────────────
  it("GET /admin/sessions returns session list (JWT mode may be empty)", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/admin/sessions",
      headers: { Authorization: `Bearer ${saToken}` }
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body.data)).toBe(true);
  });

  // ── STAFF/TENANT ACCESS CHECK ─────────────────────────────────
  it("rejects staff user from accessing admin endpoints", async () => {
    const hash = hashPassword("staff-pass", "codexsun-staff");
    await app.masterDbPool.execute(
      `INSERT INTO staff_users (display_name, email, password_hash)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
      ["Test Staff", "test-staff@codexsun.com", hash]
    );

    const loginRes = await app.inject({
      method: "POST",
      url: "/auth/login",
      body: { desk: "admin", email: "test-staff@codexsun.com", password: "staff-pass" }
    });
    const staffToken = JSON.parse(loginRes.body).data.accessToken;

    const res = await app.inject({
      method: "GET",
      url: "/admin/console",
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    expect(res.statusCode).toBe(403);
  });

  // ── Audit mutation produces audit event ───────────────────────
  it("tenant activation mutation writes audit event", async () => {
    const listRes = await app.inject({
      method: "GET",
      url: "/admin/tenants",
      headers: { Authorization: `Bearer ${saToken}` }
    });
    const tenants = JSON.parse(listRes.body).data;
    const tenant = tenants.find((t: { tenantCode: string }) => t.tenantCode.startsWith("test-"));

    await app.inject({
      method: "POST",
      url: `/admin/modules/tenant/${tenant.id}/enable`,
      headers: { Authorization: `Bearer ${saToken}` },
      body: { moduleKey: "platform.tenants" }
    });

    const auditRes = await app.inject({
      method: "GET",
      url: "/admin/audit?eventName=module.activation.enabled",
      headers: { Authorization: `Bearer ${saToken}` }
    });
    const body = JSON.parse(auditRes.body);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0].event_name).toBe("module.activation.enabled");
  });

  // ── Health/migration handle empty states ──────────────────────
  it("GET /admin/health handles degraded state gracefully", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/admin/health",
      headers: { Authorization: `Bearer ${saToken}` }
    });
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.data.status).toBeDefined();
  });
});
