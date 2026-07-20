import assert from "node:assert/strict";
import test from "node:test";
import { createApiApp } from "@codexsun/framework/api";
import { createB2bConnectDatabase } from "./database.js";
import { createB2bConnectAuthenticationModule } from "./modules/authentication/index.js";
import {
  platformTestIdentity,
  platformTestSecret
} from "./modules/authentication/authentication.test-support.js";
import { createBusinessProfileModule } from "./modules/business-profile/index.js";

test("client profile changes require approval before public publication", async () => {
  const database = createB2bConnectDatabase(":memory:");
  const app = await createApiApp({
    appName: "B2B Connect business profile test",
    cookieSecret: "test-cookie-secret",
    corsOrigins: ["http://127.0.0.1:7140"],
    environment: "test"
  });
  const authentication = createB2bConnectAuthenticationModule({
    deploymentTenantCode: "B2BCONNECT",
    platformJwtSecret: platformTestSecret
  });
  authentication.register(app);
  createBusinessProfileModule(database, authentication.service).register(app);

  const clientIdentity = platformTestIdentity("tenant");
  const adminIdentity = platformTestIdentity("staff");
  const profileInput = {
    association: "teama",
    businessName: "Knit Network Private Limited",
    capacityNote: "25,000 pieces available this month",
    capabilities: ["Organic cotton", "Private label"],
    description: "A Tirupur garment manufacturer serving responsible global apparel buyers.",
    industrySegment: "Garment manufacturing",
    productsServices: "T-shirts, polos, private-label production and sampling",
    whatsappEnabled: true,
    whatsappNumber: "919876543210"
  };

  const submitted = await app.inject({
    headers: clientIdentity.headers,
    method: "PUT",
    payload: profileInput,
    url: "/b2bconnect/app/profile"
  });
  assert.equal(submitted.statusCode, 200);
  const profile = submitted.json().data as { status: string; uuid: string };
  assert.equal(profile.status, "pending");

  const beforeApproval = await app.inject({ method: "GET", url: "/b2bconnect/public/profiles" });
  assert.deepEqual(beforeApproval.json().data, []);

  const approved = await app.inject({
    headers: adminIdentity.headers,
    method: "PATCH",
    payload: { decision: "approve", note: "Verified association member." },
    url: `/b2bconnect/admin/profiles/${profile.uuid}/review`
  });
  assert.equal(approved.statusCode, 200);
  assert.equal(approved.json().data.status, "approved");

  const afterApproval = await app.inject({ method: "GET", url: "/b2bconnect/public/profiles" });
  assert.equal(afterApproval.json().data.length, 1);
  assert.equal(afterApproval.json().data[0].businessName, profileInput.businessName);
  assert.equal("ownerEmail" in afterApproval.json().data[0], false);
  assert.equal("reviewNote" in afterApproval.json().data[0], false);

  const resubmitted = await app.inject({
    headers: clientIdentity.headers,
    method: "PUT",
    payload: { ...profileInput, capacityNote: "40,000 pieces available next month" },
    url: "/b2bconnect/app/profile"
  });
  assert.equal(resubmitted.json().data.status, "pending");
  const afterEdit = await app.inject({ method: "GET", url: "/b2bconnect/public/profiles" });
  assert.deepEqual(afterEdit.json().data, []);

  const activity = database
    .prepare("SELECT action FROM b2b_business_profile_activity ORDER BY id")
    .all() as Array<{ action: string }>;
  const reviews = database
    .prepare("SELECT decision FROM b2b_business_profile_reviews")
    .all() as Array<{
    decision: string;
  }>;
  assert.deepEqual(
    activity.map(({ action }) => action),
    ["submitted", "resubmitted"]
  );
  assert.deepEqual(
    reviews.map(({ decision }) => decision),
    ["approve"]
  );
  await app.close();
  database.close();
});
