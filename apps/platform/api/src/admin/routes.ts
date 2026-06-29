import { AppError } from "@codexsun/framework/errors";
import { ok } from "@codexsun/framework/http";
import { requirePermission, requireSuperAdmin } from "../auth/guards.js";
import type { FastifyInstance } from "fastify";

function responseMeta(request: { correlationId?: string; id: string; tenantId?: string }) {
  return {
    requestId: request.id,
    ...(request.correlationId ? { correlationId: request.correlationId } : {}),
    ...(request.tenantId ? { tenantId: request.tenantId } : {})
  };
}

function toNumber(v: unknown): number {
  if (typeof v === "bigint") return Number(v);
  if (typeof v === "number") return v;
  return Number(v) || 0;
}

function convertRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    out[key] = typeof value === "bigint" ? Number(value) : value;
  }
  return out;
}

export async function registerAdminRoutes(app: FastifyInstance) {
  // ── Console Dashboard ──────────────────────────────────────────
  app.get("/admin/console", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.tenant.profile.view");

    const [tenantRows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      "SELECT COUNT(*) as total, SUM(status='active') as active, SUM(status='suspended') as suspended FROM tenants"
    );
    const r = tenantRows[0] || {};
    const tenantStats = { total: toNumber(r.total), active: toNumber(r.active), suspended: toNumber(r.suspended) };

    const [moduleRows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      "SELECT COUNT(DISTINCT module_key) as total FROM tenant_module_activation WHERE status = 'enabled'"
    );
    const enabledModules = toNumber(moduleRows[0]?.total);

    const [auditRows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      "SELECT COUNT(*) as total FROM audit_events WHERE created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)"
    );
    const recentAudits = toNumber(auditRows[0]?.total);

    const [migrationRows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      "SELECT COUNT(*) as total FROM platform_migrations"
    );
    const migrationCount = toNumber(migrationRows[0]?.total);

    return ok({
      tenants: tenantStats,
      enabledModules,
      recentAudits,
      migrations: migrationCount,
      dbStatus: {
        masterDatabase: "codexsun_master_db",
        ready: true
      }
    }, responseMeta(request));
  });

  // ── Tenant Registry Routes ─────────────────────────────────────
  app.get("/admin/tenants", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.tenant.profile.view");
    const tenants = await app.tenantService.list();
    return ok(tenants, responseMeta(request));
  });

  app.get("/admin/tenants/:id", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.tenant.profile.view");
    const { id } = request.params as { id: string };
    const tenant = await app.tenantService.getById(id);
    return ok(tenant, responseMeta(request));
  });

  app.post("/admin/tenants", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.tenant.profile.manage");
    const body = request.body as { tenantCode: string; tenantName: string; status?: string };
    const tenant = await app.tenantService.create({
      tenantCode: body.tenantCode,
      tenantName: body.tenantName,
      ...(body.status ? { status: body.status } : {})
    });
    await app.auditService.tenantCreated({
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      tenantId: tenant.id,
      tenantCode: tenant.tenantCode
    });
    return ok(tenant, responseMeta(request));
  });

  app.put("/admin/tenants/:id", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.tenant.profile.manage");
    const { id } = request.params as { id: string };
    const body = request.body as Record<string, unknown>;
    const input: { tenantName?: string; status?: string } = {};
    if (typeof body.tenantName === "string") input.tenantName = body.tenantName;
    if (typeof body.status === "string") input.status = body.status;
    const changes: Record<string, unknown> = {};
    if (input.tenantName !== undefined) changes.tenantName = input.tenantName;
    if (input.status !== undefined) changes.status = input.status;
    const tenant = await app.tenantService.update(id, input);
    await app.auditService.tenantUpdated({
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      tenantId: id,
      changes
    });
    return ok(tenant, responseMeta(request));
  });

  app.post("/admin/tenants/:id/suspend", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.tenant.profile.manage");
    const { id } = request.params as { id: string };
    const tenant = await app.tenantService.update(id, { status: "suspended" });
    await app.auditService.tenantUpdated({
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      tenantId: id,
      changes: { status: "suspended" }
    });
    return ok(tenant, responseMeta(request));
  });

  app.post("/admin/tenants/:id/restore", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.tenant.profile.manage");
    const { id } = request.params as { id: string };
    const tenant = await app.tenantService.update(id, { status: "active" });
    await app.auditService.tenantUpdated({
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      tenantId: id,
      changes: { status: "active" }
    });
    return ok(tenant, responseMeta(request));
  });

  // ── Module Activation ──────────────────────────────────────────
  app.get("/admin/modules/catalog", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const modules = app.moduleCatalog.getAll();
    return ok(modules, responseMeta(request));
  });

  app.get("/admin/modules/tenant/:tenantId", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.activation.view");
    const { tenantId } = request.params as { tenantId: string };
    const enabled = await app.moduleCatalog.getTenantEnabledModules(tenantId);
    return ok(enabled, responseMeta(request));
  });

  app.post("/admin/modules/tenant/:tenantId/enable", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.activation.manage");
    const { tenantId } = request.params as { tenantId: string };
    const body = request.body as { moduleKey: string };
    const moduleKey = body.moduleKey;
    const alreadyEnabled = await app.moduleCatalog.isModuleEnabledForTenant(tenantId, moduleKey);
    if (!alreadyEnabled) {
      await app.masterDbPool.execute(
        `INSERT INTO tenant_module_activation (tenant_id, module_key, status) VALUES (?, ?, 'enabled')
         ON DUPLICATE KEY UPDATE status = 'enabled'`,
        [tenantId, moduleKey]
      );
    }
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "module.activation.enabled",
      tenantId,
      payload: { moduleKey }
    });
    return ok({ enabled: true, moduleKey }, responseMeta(request));
  });

  app.post("/admin/modules/tenant/:tenantId/disable", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.activation.manage");
    const { tenantId } = request.params as { tenantId: string };
    const body = request.body as { moduleKey: string };
    const moduleKey = body.moduleKey;
    await app.masterDbPool.execute(
      "UPDATE tenant_module_activation SET status = 'disabled' WHERE tenant_id = ? AND module_key = ?",
      [tenantId, moduleKey]
    );
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "module.activation.disabled",
      tenantId,
      payload: { moduleKey }
    });
    return ok({ enabled: false, moduleKey }, responseMeta(request));
  });

  // ── Audit Viewer ───────────────────────────────────────────────
  app.get("/admin/audit", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.audit.activity.view");
    const query = request.query as Record<string, string | undefined>;
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (query.actorEmail) { conditions.push("actor_email = ?"); values.push(query.actorEmail); }
    if (query.eventName) { conditions.push("event_name = ?"); values.push(query.eventName); }
    if (query.fromDate) { conditions.push("created_at >= ?"); values.push(query.fromDate); }
    if (query.toDate) { conditions.push("created_at <= ?"); values.push(query.toDate); }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const limit = Math.min(Math.max(Number(query.limit) || 100, 1), 500);
    const offset = Math.max(Number(query.offset) || 0, 0);

    const [rows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      `SELECT id, actor_type, actor_email, correlation_id, event_name, event_payload, created_at FROM audit_events ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    );
    return ok(rows.map(convertRow), responseMeta(request));
  });

  app.get("/admin/audit/actors", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.audit.activity.view");
    const [rows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      "SELECT DISTINCT actor_email FROM audit_events WHERE actor_email IS NOT NULL ORDER BY actor_email"
    );
    return ok(rows.map((r) => r.actor_email), responseMeta(request));
  });

  // ── Migration Status ───────────────────────────────────────────
  app.get("/admin/migrations", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.migration.status.view");
    const [rows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      "SELECT id, applied_at FROM platform_migrations ORDER BY id ASC"
    );
    return ok(rows.map(convertRow), responseMeta(request));
  });

  // ── Health ─────────────────────────────────────────────────────
  app.get("/admin/health", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.migration.status.view");
    const health = {
      status: "ok" as const,
      api: { status: "ok" as const, uptime: process.uptime() },
      database: { status: "ok" as const, name: "codexsun_master_db" },
      modules: app.moduleCatalog.getAll().map((m) => ({ key: m.moduleKey, name: m.displayName, status: "registered" as const }))
    };
    return ok(health, responseMeta(request));
  });

  // ── Platform Users ─────────────────────────────────────────────
  app.get("/admin/users/:userType", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.user.profile.view");
    const { userType } = request.params as { userType: string };
    if (userType !== "super_admin" && userType !== "staff") {
      return ok([], responseMeta(request));
    }
    const users = await app.userService.list(userType);
    return ok(users, responseMeta(request));
  });

  app.get("/admin/users/:userType/:id", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.user.profile.view");
    const { userType, id } = request.params as { userType: string; id: string };
    const user = await app.userService.getById(userType as "super_admin" | "staff", id);
    return ok(user, responseMeta(request));
  });

  app.post("/admin/users", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.user.profile.manage");
    const body = request.body as { displayName: string; email: string; password: string; userType: string; status?: string };
    const user = await app.userService.create({
      displayName: body.displayName,
      email: body.email,
      password: body.password,
      userType: body.userType as "super_admin" | "staff",
      ...(body.status ? { status: body.status } : {})
    });
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "user.created",
      payload: { userId: user.id, userType: user.userType, email: user.email }
    });
    return ok(user, responseMeta(request));
  });

  app.put("/admin/users/:userType/:id", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.user.profile.manage");
    const { userType, id } = request.params as { userType: string; id: string };
    const body = request.body as { displayName?: string; status?: string };
    const user = await app.userService.update(userType as "super_admin" | "staff", id, body);
    return ok(user, responseMeta(request));
  });

  app.post("/admin/users/:userType/:id/suspend", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.user.profile.manage");
    const { userType, id } = request.params as { userType: string; id: string };
    await app.userService.suspend(userType as "super_admin" | "staff", id);
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "user.suspended",
      payload: { userId: id, userType }
    });
    return ok({ suspended: true }, responseMeta(request));
  });

  app.post("/admin/users/:userType/:id/activate", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.user.profile.manage");
    const { userType, id } = request.params as { userType: string; id: string };
    await app.userService.activate(userType as "super_admin" | "staff", id);
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "user.activated",
      payload: { userId: id, userType }
    });
    return ok({ activated: true }, responseMeta(request));
  });

  // ── Role Management ────────────────────────────────────────────
  app.get("/admin/roles", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const roles = await app.roleService.list();
    return ok(roles, responseMeta(request));
  });

  app.get("/admin/roles/system", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    return ok(app.roleService.getAllSystemRoles(), responseMeta(request));
  });

  app.post("/admin/roles", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const body = request.body as { description: string; key: string; label: string; permissions: string[]; userType: string };
    const role = await app.roleService.create({
      ...body,
      userType: body.userType as "super_admin" | "staff" | "tenant"
    });
    return ok(role, responseMeta(request));
  });

  app.put("/admin/roles/:id", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const { id } = request.params as { id: string };
    const body = request.body as { description?: string; label?: string; permissions?: string[]; status?: string };
    const role = await app.roleService.update(id, body);
    return ok(role, responseMeta(request));
  });

  app.put("/admin/roles/:id/permissions", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const { id } = request.params as { id: string };
    const body = request.body as { permissions: string[] };
    const role = await app.roleService.updatePermissions(id, body.permissions);
    return ok(role, responseMeta(request));
  });

  // ── Permission Matrix ─────────────────────────────────────────
  app.get("/admin/permissions/matrix", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const matrix = app.roleService.getPermissionsMatrix();
    const allPermissions = (await import("@codexsun/platform/permissions")).platformPermissionsAll;
    return ok({ matrix, allPermissions }, responseMeta(request));
  });

  // ── Active Sessions ────────────────────────────────────────────
  app.get("/admin/sessions", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.user.profile.view");
    const sessions = await app.authService.getSessionStore().listAsync();
    return ok(sessions, responseMeta(request));
  });

  app.delete("/admin/sessions/:token", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.user.profile.manage");
    const { token } = request.params as { token: string };
    await app.authService.getSessionStore().destroyAsync(token);
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "session.revoked",
      payload: { revokedToken: token }
    });
    return ok({ revoked: true }, responseMeta(request));
  });

  // ── Tenant Domain Mappings ─────────────────────────────────────
  app.get("/admin/tenants/:tenantId/domains", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.tenant.profile.view");
    const { tenantId } = request.params as { tenantId: string };
    const [rows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      "SELECT id, tenant_id, domain_name, status, created_at FROM tenant_domain_mappings WHERE tenant_id = ? ORDER BY created_at ASC",
      [tenantId]
    );
    return ok(rows.map(convertRow), responseMeta(request));
  });

  app.post("/admin/tenants/:tenantId/domains", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.tenant.profile.manage");
    const { tenantId } = request.params as { tenantId: string };
    const body = request.body as { domainName: string };
    if (!body.domainName?.trim()) throw AppError.validation("domainName is required");
    await app.masterDbPool.execute(
      "INSERT INTO tenant_domain_mappings (tenant_id, domain_name, status) VALUES (?, ?, 'active')",
      [tenantId, body.domainName.trim()]
    );
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "tenant.domain.added",
      tenantId,
      payload: { domainName: body.domainName }
    });
    return ok({ domainName: body.domainName }, responseMeta(request));
  });

  app.delete("/admin/tenants/:tenantId/domains/:id", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.tenant.profile.manage");
    const { tenantId, id } = request.params as { tenantId: string; id: string };
    await app.masterDbPool.execute(
      "DELETE FROM tenant_domain_mappings WHERE id = ? AND tenant_id = ?",
      [id, tenantId]
    );
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "tenant.domain.removed",
      tenantId,
      payload: { domainId: id }
    });
    return ok({ removed: true }, responseMeta(request));
  });

  // ── Migration Runner (Database Manager) ────────────────────────
  app.post("/admin/migrations/run", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.migration.status.view");
    const { MigrationRunner } = await import("../db/migration-runner.js");
    const { masterMigrations } = await import("../db/migrations/master-index.js");
    const runner = new MigrationRunner(app.masterDbPool);
    await runner.initialize();
    const pending = runner.listPending(masterMigrations);
    const results: Array<{ id: string; status: string }> = [];
    for (const migration of pending) {
      try {
        await runner.run(migration);
        results.push({ id: migration.id, status: "applied" });
      } catch {
        results.push({ id: migration.id, status: "error" });
      }
    }
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "migration.run",
      payload: { results }
    });
    return ok({ applied: results.length, results }, responseMeta(request));
  });

  // ── Database Connection Status ────────────────────────────────
  app.get("/admin/databases", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.migration.status.view");
    const [dbRows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      "SELECT id, tenant_id, database_name, status, created_at FROM tenant_databases ORDER BY created_at ASC"
    );
    const databases = dbRows.map(convertRow).map((r) => ({
      ...r,
      dbStatus: "unknown"
    }));
    return ok(databases, responseMeta(request));
  });
}
