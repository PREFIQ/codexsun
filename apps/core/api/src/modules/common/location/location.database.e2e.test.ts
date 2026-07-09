import { afterAll, beforeAll, describe, expect, it } from "vitest";

const runDbE2e = process.env.CODEXSUN_DB_E2E === "1";
const suffix = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
const masterDb = `codexsun_core_location_e2e_${suffix}`;

describe.skipIf(!runDbE2e)("core common location database e2e", () => {
  beforeAll(() => {
    process.env.JWT_SECRET ||= "core-location-e2e-secret";
    process.env.DB_MASTER_NAME = masterDb;
  });

  afterAll(async () => {
    const { closeCoreDatabase } = await import("../../../database/core-database.js");
    const { createConnection } = await import("mysql2/promise");
    await closeCoreDatabase();

    const connection = await createConnection({
      host: process.env.DB_HOST ?? "127.0.0.1",
      password: process.env.DB_PASSWORD ?? "",
      port: Number(process.env.DB_PORT ?? 3306),
      timezone: "Z",
      user: process.env.DB_USER ?? "root"
    });
    try {
      await connection.query(`DROP DATABASE IF EXISTS \`${masterDb}\``);
    } finally {
      await connection.end();
    }
  });

  it("seeds readable location records and isolates tenant-specific records", async () => {
    const { createApp } = await import("../../../app.js");
    const app = await createApp();

    const countries = await app.inject({ method: "GET", url: "/core/common/location/countries" });
    expect(countries.statusCode).toBe(200);
    const countryBody = countries.json() as { data: Array<{ id: string; name: string; tenantId: string }> };
    expect(countryBody.data[0]?.name).toBe("India");
    expect(countryBody.data.some((country) => country.id === "global-country-in" && country.tenantId === "global")).toBe(true);

    const states = await app.inject({ method: "GET", url: "/core/common/location/states?countryId=global-country-in" });
    expect(states.statusCode).toBe(200);
    const stateBody = states.json() as { data: Array<{ gstStateCode: string | null; name: string }> };
    expect(stateBody.data[0]?.name).toBe("-");
    expect(stateBody.data.some((state) => state.name === "Tamil Nadu" && state.gstStateCode === "33")).toBe(true);

    const created = await app.inject({
      headers: { "x-tenant-id": "tenant-alpha" },
      method: "POST",
      payload: {
        code: "ALPHA-CITY",
        countryId: "global-country-in",
        countryName: "India",
        districtId: "global-district-coimbatore",
        districtName: "Coimbatore",
        name: "Tenant Alpha City",
        sortOrder: 900,
        stateId: "global-state-tamil-nadu",
        stateName: "Tamil Nadu",
        status: "active"
      },
      url: "/core/common/location/cities"
    });
    expect(created.statusCode).toBe(200);
    const createdBody = created.json() as { data: { id: string; name: string; tenantId: string } };
    expect(createdBody.data.tenantId).toBe("tenant-alpha");

    const tenantAlpha = await app.inject({ headers: { "x-tenant-id": "tenant-alpha" }, method: "GET", url: "/core/common/location/cities" });
    const tenantBeta = await app.inject({ headers: { "x-tenant-id": "tenant-beta" }, method: "GET", url: "/core/common/location/cities" });
    const alphaBody = tenantAlpha.json() as { data: Array<{ name: string; tenantId: string }> };
    const betaBody = tenantBeta.json() as { data: Array<{ name: string; tenantId: string }> };

    expect(alphaBody.data.some((city) => city.name === "Tenant Alpha City" && city.tenantId === "tenant-alpha")).toBe(true);
    expect(betaBody.data.some((city) => city.name === "Tenant Alpha City")).toBe(false);
    expect(betaBody.data.some((city) => city.name === "Coimbatore" && city.tenantId === "global")).toBe(true);

    const commonMasterPaths = [
      "/core/common/contacts/contact-groups",
      "/core/common/contacts/contact-types",
      "/core/common/contacts/address-types",
      "/core/common/contacts/bank-names",
      "/core/common/products/product-groups",
      "/core/common/products/product-categories",
      "/core/common/products/product-types",
      "/core/common/products/units",
      "/core/common/products/hsn-codes",
      "/core/common/products/taxes",
      "/core/common/products/brands",
      "/core/common/products/colours",
      "/core/common/products/sizes",
      "/core/common/products/styles",
      "/core/common/workorder/work-order-types",
      "/core/common/workorder/transports",
      "/core/common/workorder/warehouses",
      "/core/common/workorder/destinations",
      "/core/common/workorder/stock-rejection-types",
      "/core/common/others/currencies",
      "/core/common/others/priorities",
      "/core/common/others/payment-terms",
      "/core/common/others/sales-types",
      "/core/common/others/months"
    ];
    for (const url of commonMasterPaths) {
      const response = await app.inject({ headers: { "x-tenant-id": "tenant-alpha" }, method: "GET", url });
      expect(response.statusCode, url).toBe(200);
      expect(Array.isArray(response.json().data), url).toBe(true);
    }

    const contactGroup = await app.inject({
      headers: { "x-tenant-id": "tenant-alpha" },
      method: "POST",
      payload: { isActive: true, name: "Tenant Alpha Group", sortOrder: 900 },
      url: "/core/common/contacts/contact-groups"
    });
    expect(contactGroup.statusCode).toBe(200);
    const alphaGroups = await app.inject({ headers: { "x-tenant-id": "tenant-alpha" }, method: "GET", url: "/core/common/contacts/contact-groups" });
    const betaGroups = await app.inject({ headers: { "x-tenant-id": "tenant-beta" }, method: "GET", url: "/core/common/contacts/contact-groups" });
    expect(alphaGroups.json().data.some((record: { name: string }) => record.name === "Tenant Alpha Group")).toBe(true);
    expect(betaGroups.json().data.some((record: { name: string }) => record.name === "Tenant Alpha Group")).toBe(false);

    await app.close();
  }, 30000);
});
