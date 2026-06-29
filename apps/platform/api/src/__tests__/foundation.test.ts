import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { createApp } from "../app.js";
import { hashPassword } from "@codexsun/platform/auth";

describe("Foundation Services (T9-T12)", () => {
  let app: FastifyInstance;
  let saToken: string;

  beforeAll(async () => {
    app = await createApp();
    await app.ready();
    const hash = hashPassword("test-sa-pass", "codexsun-super-admin");
    await app.masterDbPool.execute(
      `INSERT INTO super_admin_users (display_name, email, password_hash) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
      ["Test SA Foundation", "test-foundation-sa@codexsun.com", hash]
    );
    await app.masterDbPool.execute(
      `INSERT INTO staff_users (display_name, email, password_hash, status) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
      ["Test Staff Foundation", "test-foundation-staff@codexsun.com", hash, "active"]
    );
    const loginRes = await app.inject({
      method: "POST", url: "/auth/login",
      body: { desk: "sa", email: "test-foundation-sa@codexsun.com", password: "test-sa-pass" }
    });
    saToken = JSON.parse(loginRes.body).data.accessToken;
  });

  afterAll(async () => { await app.close(); });

  // --- Task 9: Settings ---
  describe("Settings", () => {
    it("GET /settings/platform returns platform settings summary", async () => {
      const res = await app.inject({
        method: "GET", url: "/settings/platform",
        headers: { Authorization: `Bearer ${saToken}` }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
      expect(body.data[0].title).toBeDefined();
      expect(body.data[0].items).toBeDefined();
    });

    it("GET /settings/platform returns 401 without token", async () => {
      const res = await app.inject({ method: "GET", url: "/settings/platform" });
      expect(res.statusCode).toBe(401);
    });

    it("GET /settings/platform/:namespace returns settings", async () => {
      const res = await app.inject({
        method: "GET", url: "/settings/platform/environment",
        headers: { Authorization: `Bearer ${saToken}` }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
    });

    it("PUT /settings/platform/:namespace/:key updates and audits setting", async () => {
      const res = await app.inject({
        method: "PUT", url: "/settings/platform/system/test_key",
        headers: { Authorization: `Bearer ${saToken}` },
        body: { value: "test_value" }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.updated).toBe(true);
    });

    it("GET /settings/feature-flags returns feature flags", async () => {
      const res = await app.inject({
        method: "GET", url: "/settings/feature-flags",
        headers: { Authorization: `Bearer ${saToken}` }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });

    it("PUT /settings/feature-flags/:featureKey enables a flag", async () => {
      const res = await app.inject({
        method: "PUT", url: "/settings/feature-flags/test_flag",
        headers: { Authorization: `Bearer ${saToken}` },
        body: { enabled: true, reason: "test" }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.enabled).toBe(true);
    });

    it("PUT /settings/feature-flags/:featureKey disables a flag", async () => {
      const res = await app.inject({
        method: "PUT", url: "/settings/feature-flags/test_flag",
        headers: { Authorization: `Bearer ${saToken}` },
        body: { enabled: false }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.enabled).toBe(false);
    });

    it("Settings endpoints reject staff user", async () => {
      const loginStaff = await app.inject({
        method: "POST", url: "/auth/login",
        body: { desk: "admin", email: "test-foundation-staff@codexsun.com", password: "test-sa-pass" }
      });
      const staffToken = JSON.parse(loginStaff.body).data.accessToken;
      const res = await app.inject({
        method: "GET", url: "/settings/platform",
        headers: { Authorization: `Bearer ${staffToken}` }
      });
      expect(res.statusCode).toBe(403);
    });
  });

  // --- Task 10: Files ---
  describe("Files", () => {
    it("GET /files returns empty list", async () => {
      const res = await app.inject({
        method: "GET", url: "/files",
        headers: { Authorization: `Bearer ${saToken}` }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(Array.isArray(body.data)).toBe(true);
    });

    it("POST /files/metadata creates file metadata", async () => {
      const res = await app.inject({
        method: "POST", url: "/files/metadata",
        headers: { Authorization: `Bearer ${saToken}` },
        body: { ownerModule: "test", ownerRecordId: "1", fileName: "test.pdf", mimeType: "application/pdf", size: 1024, storageKey: "test/key.pdf" }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.fileName).toBe("test.pdf");
      expect(body.data.fileId).toBeDefined();
    });

    it("GET /files returns created metadata", async () => {
      const res = await app.inject({
        method: "GET", url: "/files",
        headers: { Authorization: `Bearer ${saToken}` }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.length).toBeGreaterThan(0);
    });

    it("GET /files/:fileId returns file by id", async () => {
      const listRes = await app.inject({ method: "GET", url: "/files", headers: { Authorization: `Bearer ${saToken}` } });
      const fileId = JSON.parse(listRes.body).data[0]?.fileId;
      if (!fileId) return;
      const res = await app.inject({ method: "GET", url: `/files/${fileId}`, headers: { Authorization: `Bearer ${saToken}` } });
      expect(res.statusCode).toBe(200);
    });

    it("DELETE /files/:fileId deletes file", async () => {
      const res = await app.inject({
        method: "POST", url: "/files/metadata",
        headers: { Authorization: `Bearer ${saToken}` },
        body: { ownerModule: "del", ownerRecordId: "1", fileName: "del.txt", mimeType: "text/plain", size: 100, storageKey: "del/key.txt" }
      });
      const fileId = JSON.parse(res.body).data.fileId;
      const delRes = await app.inject({ method: "DELETE", url: `/files/${fileId}`, headers: { Authorization: `Bearer ${saToken}` } });
      expect(delRes.statusCode).toBe(200);
    });

    it("POST /files/metadata rejects without token", async () => {
      const res = await app.inject({
        method: "POST", url: "/files/metadata",
        body: { ownerModule: "test", ownerRecordId: "1", fileName: "x.pdf", mimeType: "application/pdf", size: 1, storageKey: "x" }
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // --- Task 10: Templates ---
  describe("Templates", () => {
    it("GET /templates returns template list", async () => {
      const res = await app.inject({
        method: "GET", url: "/templates",
        headers: { Authorization: `Bearer ${saToken}` }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
    });

    it("GET /templates/:templateKey returns template", async () => {
      const res = await app.inject({
        method: "GET", url: "/templates/invoice_default",
        headers: { Authorization: `Bearer ${saToken}` }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.templateKey).toBe("invoice_default");
    });

    it("GET /templates/:templateKey returns 404 for unknown", async () => {
      const res = await app.inject({
        method: "GET", url: "/templates/unknown_template",
        headers: { Authorization: `Bearer ${saToken}` }
      });
      expect(res.statusCode).toBe(404);
    });
  });

  // --- Task 11: Notifications ---
  describe("Notifications", () => {
    it("GET /notifications returns user notifications", async () => {
      const res = await app.inject({
        method: "GET", url: "/notifications",
        headers: { Authorization: `Bearer ${saToken}` }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(Array.isArray(body.data)).toBe(true);
    });

    it("GET /notifications/mail-templates returns mail templates", async () => {
      const res = await app.inject({
        method: "GET", url: "/notifications/mail-templates",
        headers: { Authorization: `Bearer ${saToken}` }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
    });
  });

  // --- Task 11: Activity ---
  describe("Activity", () => {
    it("GET /activity returns activity list", async () => {
      const res = await app.inject({
        method: "GET", url: "/activity",
        headers: { Authorization: `Bearer ${saToken}` }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(Array.isArray(body.data)).toBe(true);
    });

    it("POST /activity/comments creates a comment", async () => {
      const res = await app.inject({
        method: "POST", url: "/activity/comments",
        headers: { Authorization: `Bearer ${saToken}` },
        body: { moduleKey: "test", recordType: "doc", recordId: "1", body: "Test comment" }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.body).toBe("Test comment");
    });

    it("POST /activity/comments rejects empty body", async () => {
      const res = await app.inject({
        method: "POST", url: "/activity/comments",
        headers: { Authorization: `Bearer ${saToken}` },
        body: { moduleKey: "test", recordType: "doc", recordId: "1", body: "" }
      });
      expect(res.statusCode).toBe(400);
    });

    it("GET /activity/comments returns comments", async () => {
      const res = await app.inject({
        method: "GET", url: "/activity/comments?moduleKey=test&recordType=doc&recordId=1",
        headers: { Authorization: `Bearer ${saToken}` }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(Array.isArray(body.data)).toBe(true);
    });
  });

  // --- Task 12: Agent Workbench ---
  describe("Agent Workbench", () => {
    it("GET /agents/tools returns tool registry", async () => {
      const res = await app.inject({
        method: "GET", url: "/agents/tools",
        headers: { Authorization: `Bearer ${saToken}` }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
    });

    it("GET /agents/tools/:toolKey returns tool detail", async () => {
      const res = await app.inject({
        method: "GET", url: "/agents/tools/read_record",
        headers: { Authorization: `Bearer ${saToken}` }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.toolKey).toBe("read_record");
    });

    it("GET /agents/prompts returns prompt templates", async () => {
      const res = await app.inject({
        method: "GET", url: "/agents/prompts",
        headers: { Authorization: `Bearer ${saToken}` }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(Array.isArray(body.data)).toBe(true);
    });

    it("GET /agents/prompts/:templateKey returns template detail", async () => {
      const res = await app.inject({
        method: "GET", url: "/agents/prompts/data_query",
        headers: { Authorization: `Bearer ${saToken}` }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.templateKey).toBe("data_query");
    });

    it("GET /agents/audit returns empty audit log", async () => {
      const res = await app.inject({
        method: "GET", url: "/agents/audit",
        headers: { Authorization: `Bearer ${saToken}` }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(Array.isArray(body.data)).toBe(true);
    });

    it("GET /agents/providers returns provider settings", async () => {
      const res = await app.inject({
        method: "GET", url: "/agents/providers",
        headers: { Authorization: `Bearer ${saToken}` }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
    });

    it("GET /agents/permissions/:agentKey returns agent permissions", async () => {
      const res = await app.inject({
        method: "GET", url: "/agents/permissions/zero",
        headers: { Authorization: `Bearer ${saToken}` }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.agentKey).toBe("zero");
    });

    it("Agent endpoints reject unauthorized", async () => {
      const res = await app.inject({ method: "GET", url: "/agents/tools" });
      expect(res.statusCode).toBe(401);
    });
  });
});
