import assert from "node:assert/strict";
import test from "node:test";
import { AppError } from "@codexsun/framework/errors";
import { B2bConnectAuthenticationService } from "./authentication.service.js";
import { platformTestIdentity, platformTestSecret } from "./authentication.test-support.js";

const authentication = new B2bConnectAuthenticationService({
  deploymentTenantCode: "B2BCONNECT",
  platformJwtSecret: platformTestSecret
});

test("maps a Platform staff session to the B2B admin desk", () => {
  const session = authentication.requireSession(platformTestIdentity("staff").headers, "admin");
  assert.equal(session.role, "admin");
  assert.equal(session.email, "staff@example.test");
});

test("accepts the deployment tenant without exposing a tenant selector", () => {
  const session = authentication.requireSession(platformTestIdentity("tenant").headers, "client");
  assert.equal(session.role, "client");
});

test("rejects a tenant from another application deployment", () => {
  assert.throws(
    () =>
      authentication.requireSession(
        platformTestIdentity("tenant", { tenantCode: "OTHERAPP" }).headers,
        "client"
      ),
    (error) => error instanceof AppError && error.statusCode === 403
  );
});

test("rejects a valid Platform identity at the wrong desk", () => {
  assert.throws(
    () => authentication.requireSession(platformTestIdentity("super_admin").headers, "admin"),
    (error) => error instanceof AppError && error.statusCode === 403
  );
});

test("rejects missing tenant database context", () => {
  const identity = platformTestIdentity("tenant");
  assert.throws(
    () =>
      authentication.requireSession({ authorization: identity.headers.authorization }, "client"),
    (error) => error instanceof AppError && error.statusCode === 401
  );
});
