import assert from "node:assert/strict";
import test from "node:test";
import { createApiApp } from "@codexsun/framework/api";
import { createB2bConnectAdministrationModule } from "./modules/administration/index.js";
import { createB2bConnectAuthenticationModule } from "./modules/authentication/index.js";
import {
  platformTestIdentity,
  platformTestSecret
} from "./modules/authentication/authentication.test-support.js";
import { createB2bConnectClientPortalModule } from "./modules/client-portal/index.js";
import { createB2bConnectSuperAdministrationModule } from "./modules/super-administration/index.js";

test("Platform identity opens only the matching protected B2B desk", async () => {
  const app = await createApiApp({
    appName: "B2B Connect auth test",
    cookieSecret: "test-cookie-secret",
    corsOrigins: ["http://127.0.0.1:7140"],
    environment: "test"
  });
  const authentication = createB2bConnectAuthenticationModule({
    deploymentTenantCode: "B2BCONNECT",
    platformJwtSecret: platformTestSecret
  });
  authentication.register(app);
  createB2bConnectClientPortalModule(authentication.service).register(app);
  createB2bConnectAdministrationModule(authentication.service).register(app);
  createB2bConnectSuperAdministrationModule(authentication.service).register(app);

  const clientIdentity = platformTestIdentity("tenant");
  const clientDashboard = await app.inject({
    headers: clientIdentity.headers,
    method: "GET",
    url: "/b2bconnect/app/dashboard"
  });
  assert.equal(clientDashboard.statusCode, 200);
  assert.equal(clientDashboard.json().data.accessLabel, "Client portal");

  const administrationDashboard = await app.inject({
    headers: clientIdentity.headers,
    method: "GET",
    url: "/b2bconnect/admin/dashboard"
  });
  assert.equal(administrationDashboard.statusCode, 403);

  const anonymousDashboard = await app.inject({
    method: "GET",
    url: "/b2bconnect/sa/dashboard"
  });
  assert.equal(anonymousDashboard.statusCode, 401);
  await app.close();
});

test("B2B does not expose its own credential login route", async () => {
  const app = await createApiApp({
    appName: "B2B Connect auth ownership test",
    cookieSecret: "test-cookie-secret",
    corsOrigins: ["http://127.0.0.1:7140"],
    environment: "test"
  });
  createB2bConnectAuthenticationModule({
    deploymentTenantCode: "B2BCONNECT",
    platformJwtSecret: platformTestSecret
  }).register(app);
  const response = await app.inject({ method: "POST", url: "/b2bconnect/auth/login" });
  assert.equal(response.statusCode, 404);
  await app.close();
});
