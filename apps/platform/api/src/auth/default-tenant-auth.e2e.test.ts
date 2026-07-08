import { afterAll, beforeAll, describe, expect, it } from "vitest";

const runDbE2e = process.env.CODEXSUN_DB_E2E === "1";
const suffix = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
const masterDb = `cxsun_master_e2e_${suffix}`;
const tenantDb = `codexsun_db_e2e_${suffix}`;

describe.skipIf(!runDbE2e)("CODEXSUN default tenant auth e2e", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = "codexsun-default-tenant-e2e-secret";
    process.env.DB_MASTER_NAME = masterDb;
    process.env.ENABLE_DEFAULT_TENANT_SEED = "1";
    process.env.DEFAULT_TENANT_NAME = "CODEXSUN";
    process.env.DEFAULT_TENANT_CORPORATE_ID = "CODEXSUN";
    process.env.DEFAULT_TENANT_SLUG = "codexsun";
    process.env.DEFAULT_TENANT_DB_NAME = tenantDb;
    process.env.DEFAULT_TENANT_DOMAIN = "localhost";
    process.env.DEFAULT_TENANT_ADMIN_NAME = "CODEXSUN Admin";
    process.env.DEFAULT_TENANT_ADMIN_EMAIL = "admin@codexsun.test";
    process.env.DEFAULT_TENANT_ADMIN_PASSWORD = "CodexsunTenant#12345";
  });

  afterAll(async () => {
    const { closePlatformDatabase, platformDatabaseConfig } = await import("../database/platform-database.js");
    const { createConnection } = await import("mysql2/promise");
    await closePlatformDatabase();
    const config = platformDatabaseConfig();
    const connection = await createConnection({
      host: config.host,
      password: config.password,
      port: config.port,
      timezone: "Z",
      user: config.user
    });
    try {
      await connection.query(`DROP DATABASE IF EXISTS \`${masterDb}\``);
      await connection.query(`DROP DATABASE IF EXISTS \`${tenantDb}\``);
    } finally {
      await connection.end();
    }
  });

  it("seeds CODEXSUN, logs in, verifies session, and resolves tenant runtime", async () => {
    const { createApp } = await import("../app.js");
    const { verifyAuthToken } = await import("./jwt.js");
    const app = await createApp();

    try {
      const loginResponse = await app.inject({
        method: "POST",
        url: "/auth/login",
        headers: {
          host: "localhost"
        },
        payload: {
          corporateId: "CODEXSUN",
          desk: "tenant",
          email: "admin@codexsun.test",
          password: "CodexsunTenant#12345"
        }
      });

      expect(loginResponse.statusCode).toBe(200);
      const loginBody = loginResponse.json() as {
        data: {
          accessToken: string;
          email: string;
          tenantCode: string;
          tenantId: string;
          userType: string;
        };
      };
      expect(loginBody.data.tenantCode).toBe("CODEXSUN");
      expect(loginBody.data.tenantId).toBe("tenant-codexsun");
      expect(loginBody.data.userType).toBe("tenant");

      const payload = verifyAuthToken(loginBody.data.accessToken);
      expect(payload?.tenantId).toBe("tenant-codexsun");
      expect(payload?.tenantCode).toBe("CODEXSUN");
      expect(payload?.jti).toBeTruthy();

      const sessionResponse = await app.inject({
        method: "GET",
        url: "/auth/session",
        headers: {
          authorization: `Bearer ${loginBody.data.accessToken}`
        }
      });
      expect(sessionResponse.statusCode).toBe(200);
      expect(sessionResponse.json().data.tenantId).toBe("tenant-codexsun");

      const runtimeResponse = await app.inject({
        method: "GET",
        url: "/tenant/runtime",
        headers: {
          authorization: `Bearer ${loginBody.data.accessToken}`,
          "x-tenant-id": "tenant-codexsun"
        }
      });
      expect(runtimeResponse.statusCode).toBe(200);
      expect(runtimeResponse.json().data.tenant.tenantCode).toBe("CODEXSUN");
    } finally {
      await app.close();
    }
  });
});
