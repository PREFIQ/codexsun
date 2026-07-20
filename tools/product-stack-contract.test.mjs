import assert from "node:assert/strict";
import test from "node:test";
import { matchesServiceHealthContract } from "./dev-stack-health.mjs";
import {
  affectedProductStacks,
  marketplaceServices,
  productStackContract
} from "./product-stack-contract.mjs";

test("product stacks bind the required foundation without sharing business ownership", () => {
  assert.deepEqual(productStackContract.billing.formula, [
    "framework",
    "platform",
    "core",
    "billing"
  ]);
  assert.deepEqual(productStackContract.b2bconnect.formula, [
    "framework",
    "platform",
    "core",
    "b2bconnect"
  ]);
  assert.deepEqual(productStackContract.ecommerce.formula, [
    "framework",
    "platform",
    "core",
    "billing",
    "ecommerce"
  ]);
  assert.deepEqual(productStackContract.sites.formula, [
    "framework",
    "platform",
    "core",
    "sites"
  ]);
  assert.deepEqual(productStackContract.b2bconnect.services, [
    "platform-api",
    "core-api",
    "b2bconnect-api",
    "b2bconnect-web"
  ]);
  assert.deepEqual(productStackContract.b2bconnect.foundationServices, [
    "platform-api",
    "core-api"
  ]);
  assert.deepEqual(productStackContract.b2bconnect.productServices, [
    "b2bconnect-api",
    "b2bconnect-web"
  ]);
  assert.equal(productStackContract.b2bconnect.deploymentPolicy, "independent-product-release");
  assert.equal(productStackContract.b2bconnect.releaseTagPrefix, "v-b2bconnect-");
  assert.deepEqual(productStackContract.b2bconnect.ownedDatabaseScopes, ["b2bconnect-marketplace"]);
  assert.deepEqual(productStackContract.ecommerce.services, [
    "platform-api",
    "core-api",
    "billing-api",
    "ecommerce-api",
    "ecommerce-web"
  ]);
  assert.deepEqual(productStackContract.sites.services, ["sites-web"]);
  assert.equal(new Set(marketplaceServices).size, marketplaceServices.length);
});

test("stack impact keeps product-only changes inside their release boundary", () => {
  assert.deepEqual(affectedProductStacks(["apps/b2bconnect/api/src/app.ts"]), ["b2bconnect"]);
  assert.deepEqual(affectedProductStacks(["apps/ecommerce/web/src/main.tsx"]), ["ecommerce"]);
  assert.deepEqual(affectedProductStacks(["apps/sites/web/src/main.tsx"]), ["sites"]);
  assert.deepEqual(affectedProductStacks(["apps/billing/api/src/app.ts"]), [
    "billing",
    "ecommerce"
  ]);
  assert.deepEqual(affectedProductStacks(["packages/framework/src/api/index.ts"]), [
    "billing",
    "b2bconnect",
    "ecommerce",
    "sites"
  ]);
  assert.deepEqual(affectedProductStacks(["tools/product-stack-contract.mjs"]), [
    "billing",
    "b2bconnect",
    "ecommerce",
    "sites"
  ]);
});

test("development attachment accepts only the expected healthy dependency", () => {
  const health = {
    data: { checks: { "platform-api": { status: "ok" } }, status: "ok" },
    success: true
  };
  assert.equal(matchesServiceHealthContract(health, "platform-api"), true);
  assert.equal(matchesServiceHealthContract(health, "core-api"), false);
  assert.equal(matchesServiceHealthContract({ ...health, success: false }, "platform-api"), false);
});
