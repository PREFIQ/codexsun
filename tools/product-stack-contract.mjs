function stack({
  databaseScopes,
  formula,
  foundationServices,
  ownedDatabaseScopes,
  productServices,
  releaseTagPrefix
}) {
  return Object.freeze({
    databaseScopes: Object.freeze(databaseScopes),
    deploymentPolicy: "independent-product-release",
    formula: Object.freeze(formula),
    foundationServices: Object.freeze(foundationServices),
    migrationPolicy: "expand-contract-with-product-scoped-rollback",
    ownedDatabaseScopes: Object.freeze(ownedDatabaseScopes),
    productServices: Object.freeze(productServices),
    releaseTagPrefix,
    services: Object.freeze([...foundationServices, ...productServices])
  });
}

export const productStackContract = Object.freeze({
  billing: stack({
    databaseScopes: ["platform-master", "tenant-core", "tenant-billing"],
    formula: ["framework", "platform", "core", "billing"],
    foundationServices: ["platform-api", "core-api"],
    ownedDatabaseScopes: ["tenant-billing"],
    productServices: ["billing-api", "billing-web"],
    releaseTagPrefix: "v-billing-"
  }),
  b2bconnect: stack({
    databaseScopes: ["platform-master", "tenant-core", "b2bconnect-marketplace"],
    formula: ["framework", "platform", "core", "b2bconnect"],
    foundationServices: ["platform-api", "core-api"],
    ownedDatabaseScopes: ["b2bconnect-marketplace"],
    productServices: ["b2bconnect-api", "b2bconnect-web"],
    releaseTagPrefix: "v-b2bconnect-"
  }),
  ecommerce: stack({
    databaseScopes: ["platform-master", "tenant-core", "tenant-billing", "ecommerce-marketplace"],
    formula: ["framework", "platform", "core", "billing", "ecommerce"],
    foundationServices: ["platform-api", "core-api", "billing-api"],
    ownedDatabaseScopes: ["ecommerce-marketplace"],
    productServices: ["ecommerce-api", "ecommerce-web"],
    releaseTagPrefix: "v-ecommerce-"
  }),
  sites: stack({
    databaseScopes: [],
    formula: ["framework", "platform", "core", "sites"],
    foundationServices: [],
    ownedDatabaseScopes: [],
    productServices: ["sites-web"],
    releaseTagPrefix: "v-sites-"
  })
});

export const marketplaceServices = Object.freeze(
  Array.from(
    new Set([
      ...productStackContract.b2bconnect.services,
      ...productStackContract.ecommerce.services
    ])
  )
);

export function affectedProductStacks(paths) {
  const affected = new Set();
  for (const input of paths) {
    const path = String(input).replace(/\\/gu, "/");
    if (path.startsWith("apps/sites/")) affected.add("sites");
    else if (path.startsWith("apps/b2bconnect/")) affected.add("b2bconnect");
    else if (path.startsWith("apps/ecommerce/")) affected.add("ecommerce");
    else if (path.startsWith("apps/billing/")) {
      affected.add("billing");
      affected.add("ecommerce");
    } else if (
      path.startsWith("apps/platform/") ||
      path.startsWith("apps/core/") ||
      path.startsWith("packages/framework/") ||
      path.startsWith("packages/ui/") ||
      path === "package.json" ||
      path === "package-lock.json" ||
      path === "tools/dev-stack.mjs" ||
      path === "tools/dev-stack-health.mjs" ||
      path === "tools/product-stack-contract.mjs" ||
      path === "tools/product-stack-contract.test.mjs"
    ) {
      Object.keys(productStackContract).forEach((name) => affected.add(name));
    }
  }
  return Object.keys(productStackContract).filter((name) => affected.has(name));
}
