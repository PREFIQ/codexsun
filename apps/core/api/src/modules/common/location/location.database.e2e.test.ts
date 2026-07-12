import { afterAll, beforeAll, describe, expect, it } from "vitest";

const runDbE2e = process.env.CODEXSUN_DB_E2E === "1";
const suffix = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
const masterDb = `codexsun_core_location_master_e2e_${suffix}`;
const tenantDb = `codexsun_core_location_tenant_e2e_${suffix}`;

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
      await connection.query(`DROP DATABASE IF EXISTS \`${tenantDb}\``);
    } finally {
      await connection.end();
    }
  });

  it("seeds readable location records and isolates tenant-specific records", async () => {
    const { createApp } = await import("../../../app.js");
    const app = await createApp();
    const originalInject = app.inject.bind(app);
    app.inject = ((options: { headers?: Record<string, string>; [key: string]: unknown }) => originalInject({
      ...options,
      headers: { "x-tenant-db": tenantDb, ...(options.headers ?? {}) }
    } as never)) as typeof app.inject;

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

    const seededPincodes = await app.inject({ method: "GET", url: "/core/common/location/pincodes?cityId=global-city-coimbatore" });
    expect(seededPincodes.statusCode).toBe(200);
    const seededPincodeBody = seededPincodes.json() as {
      data: Array<{ cityId: string | null; countryId: string | null; districtId: string | null; pincode: string | null; stateId: string | null }>
    };
    expect(seededPincodeBody.data.find((record) => record.pincode === "641041")).toMatchObject({
      cityId: "global-city-coimbatore",
      countryId: "global-country-in",
      districtId: "global-district-coimbatore",
      stateId: "global-state-tamil-nadu"
    });

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

    const countryCreated = await app.inject({
      headers: { "x-tenant-id": "tenant-alpha" },
      method: "POST",
      payload: {
        code: "ALPHA",
        name: "Tenant Alpha Country",
        sortOrder: 1000,
        status: "active"
      },
      url: "/core/common/location/countries"
    });
    expect(countryCreated.statusCode).toBe(200);
    const country = (countryCreated.json() as { data: { id: string; status: string } }).data;

    const duplicateCountryCode = await app.inject({
      headers: { "x-tenant-id": "tenant-alpha" },
      method: "POST",
      payload: {
        code: "ALPHA",
        name: "Different Country Name",
        sortOrder: 1000,
        status: "active"
      },
      url: "/core/common/location/countries"
    });
    expect(duplicateCountryCode.statusCode).toBe(409);
    expect((duplicateCountryCode.json() as { error: { message: string } }).error.message)
      .toBe("Country code already exists. Enter a unique code.");

    const duplicateCountryName = await app.inject({
      headers: { "x-tenant-id": "tenant-alpha" },
      method: "POST",
      payload: {
        code: "DIFFERENT",
        name: "Tenant Alpha Country",
        sortOrder: 1000,
        status: "active"
      },
      url: "/core/common/location/countries"
    });
    expect(duplicateCountryName.statusCode).toBe(409);
    expect((duplicateCountryName.json() as { error: { message: string } }).error.message)
      .toBe("Country name already exists. Enter a unique name.");

    const countrySuspended = await app.inject({
      headers: { "x-tenant-id": "tenant-alpha" },
      method: "POST",
      url: `/core/common/location/countries/${country.id}/deactivate`
    });
    expect(countrySuspended.statusCode).toBe(200);
    expect((countrySuspended.json() as { data: { status: string } }).data.status).toBe("inactive");

    const stateCreated = await app.inject({
      headers: { "x-tenant-id": "tenant-alpha" },
      method: "POST",
      payload: {
        code: "99",
        countryId: country.id,
        countryName: "Tenant Alpha Country",
        gstStateCode: "99",
        name: "Tenant Alpha State",
        sortOrder: 1000,
        status: "active"
      },
      url: "/core/common/location/states"
    });
    expect(stateCreated.statusCode).toBe(200);
    const state = (stateCreated.json() as { data: { id: string } }).data;

    const districtCreated = await app.inject({
      headers: { "x-tenant-id": "tenant-alpha" },
      method: "POST",
      payload: {
        code: "ALPHA-DISTRICT",
        countryId: country.id,
        countryName: "Tenant Alpha Country",
        name: "Tenant Alpha District",
        sortOrder: 1000,
        stateId: state.id,
        stateName: "Tenant Alpha State",
        status: "active"
      },
      url: "/core/common/location/districts"
    });
    expect(districtCreated.statusCode).toBe(200);
    const district = (districtCreated.json() as { data: { id: string } }).data;

    const cityCreated = await app.inject({
      headers: { "x-tenant-id": "tenant-alpha" },
      method: "POST",
      payload: {
        code: "ALPHA-CITY-CHAIN",
        countryId: country.id,
        countryName: "Tenant Alpha Country",
        districtId: district.id,
        districtName: "Tenant Alpha District",
        name: "Tenant Alpha Chain City",
        sortOrder: 1000,
        stateId: state.id,
        stateName: "Tenant Alpha State",
        status: "active"
      },
      url: "/core/common/location/cities"
    });
    expect(cityCreated.statusCode).toBe(200);
    const chainCity = (cityCreated.json() as { data: { id: string } }).data;

    const pincodeCreated = await app.inject({
      headers: { "x-tenant-id": "tenant-alpha" },
      method: "POST",
      payload: {
        areaName: "Tenant Alpha Area",
        cityId: chainCity.id,
        cityName: "Tenant Alpha Chain City",
        code: "999999",
        countryId: country.id,
        countryName: "Tenant Alpha Country",
        districtId: district.id,
        districtName: "Tenant Alpha District",
        name: "999999",
        pincode: "999999",
        sortOrder: 1000,
        stateId: state.id,
        stateName: "Tenant Alpha State",
        status: "active"
      },
      url: "/core/common/location/pincodes"
    });
    expect(pincodeCreated.statusCode).toBe(200);
    const pincode = (pincodeCreated.json() as {
      data: {
        cityId: string | null;
        countryId: string | null;
        districtId: string | null;
        id: string;
        pincode: string | null;
        stateId: string | null;
      }
    }).data;
    expect(pincode).toMatchObject({
      cityId: chainCity.id,
      countryId: country.id,
      districtId: district.id,
      pincode: "999999",
      stateId: state.id
    });

    const cityPincodes = await app.inject({
      headers: { "x-tenant-id": "tenant-alpha" },
      method: "GET",
      url: `/core/common/location/pincodes?cityId=${chainCity.id}`
    });
    expect(cityPincodes.statusCode).toBe(200);
    const cityPincodeBody = cityPincodes.json() as {
      data: Array<{ cityId: string | null; countryId: string | null; districtId: string | null; pincode: string | null; stateId: string | null }>
    };
    expect(cityPincodeBody.data.find((record) => record.pincode === "999999")).toMatchObject({
      cityId: chainCity.id,
      countryId: country.id,
      districtId: district.id,
      stateId: state.id
    });

    const referencedCountryDelete = await app.inject({
      headers: { "x-tenant-id": "tenant-alpha" },
      method: "DELETE",
      url: `/core/common/location/countries/${country.id}/force`
    });
    expect(referencedCountryDelete.statusCode).toBe(409);
    expect((referencedCountryDelete.json() as { error: { message: string } }).error.message)
      .toBe("Country cannot be force deleted because it is referenced by 1 states, 1 districts, 1 cities, 1 pincodes. Remove those references first.");

    const globalCountryDelete = await app.inject({
      headers: { "x-tenant-id": "tenant-alpha" },
      method: "DELETE",
      url: "/core/common/location/countries/global-country-in/force"
    });
    expect(globalCountryDelete.statusCode).toBe(404);

    const referencedStateDelete = await app.inject({
      headers: { "x-tenant-id": "tenant-alpha" },
      method: "DELETE",
      url: `/core/common/location/states/${state.id}/force`
    });
    expect(referencedStateDelete.statusCode).toBe(409);

    const referencedDistrictDelete = await app.inject({
      headers: { "x-tenant-id": "tenant-alpha" },
      method: "DELETE",
      url: `/core/common/location/districts/${district.id}/force`
    });
    expect(referencedDistrictDelete.statusCode).toBe(409);

    const referencedCityDelete = await app.inject({
      headers: { "x-tenant-id": "tenant-alpha" },
      method: "DELETE",
      url: `/core/common/location/cities/${chainCity.id}/force`
    });
    expect(referencedCityDelete.statusCode).toBe(409);

    const pincodeDeleted = await app.inject({
      headers: { "x-tenant-id": "tenant-alpha" },
      method: "DELETE",
      url: `/core/common/location/pincodes/${pincode.id}/force`
    });
    expect(pincodeDeleted.statusCode).toBe(200);

    const cityDeleted = await app.inject({
      headers: { "x-tenant-id": "tenant-alpha" },
      method: "DELETE",
      url: `/core/common/location/cities/${chainCity.id}/force`
    });
    expect(cityDeleted.statusCode).toBe(200);

    const districtDeleted = await app.inject({
      headers: { "x-tenant-id": "tenant-alpha" },
      method: "DELETE",
      url: `/core/common/location/districts/${district.id}/force`
    });
    expect(districtDeleted.statusCode).toBe(200);

    const stateDeleted = await app.inject({
      headers: { "x-tenant-id": "tenant-alpha" },
      method: "DELETE",
      url: `/core/common/location/states/${state.id}/force`
    });
    expect(stateDeleted.statusCode).toBe(200);

    const countryDeleted = await app.inject({
      headers: { "x-tenant-id": "tenant-alpha" },
      method: "DELETE",
      url: `/core/common/location/countries/${country.id}/force`
    });
    expect(countryDeleted.statusCode).toBe(200);

    const deletedCountry = await app.inject({
      headers: { "x-tenant-id": "tenant-alpha" },
      method: "GET",
      url: `/core/common/location/countries/${country.id}`
    });
    expect(deletedCountry.statusCode).toBe(404);

    const seededCitiesResponse = await app.inject({
      headers: { "x-tenant-id": "tenant-alpha" },
      method: "GET",
      url: "/core/common/location/cities"
    });
    const seededCities = (seededCitiesResponse.json() as { data: Array<Record<string, unknown> & { id: string; name: string }> }).data;
    const editableSeededCity = seededCities.find((record) => record.name === "Coimbatore");
    const protectedPlaceholderCity = seededCities.find((record) => record.name === "-");
    expect(editableSeededCity).toBeDefined();
    expect(protectedPlaceholderCity).toBeDefined();
    if (!editableSeededCity || !protectedPlaceholderCity) {
      throw new Error("Expected seeded editable and placeholder cities.");
    }

    const seededCityUpdated = await app.inject({
      headers: { "x-tenant-id": "tenant-alpha" },
      method: "PUT",
      payload: { ...editableSeededCity, name: "Coimbatore Edited" },
      url: `/core/common/location/cities/${editableSeededCity.id}`
    });
    expect(seededCityUpdated.statusCode).toBe(200);
    expect((seededCityUpdated.json() as { data: { name: string; tenantId: string } }).data)
      .toMatchObject({ name: "Coimbatore Edited", tenantId: "global" });

    const seededCitySuspended = await app.inject({
      headers: { "x-tenant-id": "tenant-alpha" },
      method: "POST",
      url: `/core/common/location/cities/${editableSeededCity.id}/deactivate`
    });
    expect(seededCitySuspended.statusCode).toBe(200);

    const placeholderCityUpdate = await app.inject({
      headers: { "x-tenant-id": "tenant-alpha" },
      method: "PUT",
      payload: protectedPlaceholderCity,
      url: `/core/common/location/cities/${protectedPlaceholderCity.id}`
    });
    expect(placeholderCityUpdate.statusCode).toBe(404);

    const placeholderCityDelete = await app.inject({
      headers: { "x-tenant-id": "tenant-alpha" },
      method: "DELETE",
      url: `/core/common/location/cities/${protectedPlaceholderCity.id}/force`
    });
    expect(placeholderCityDelete.statusCode).toBe(404);

    const seededCityDeleted = await app.inject({
      headers: { "x-tenant-id": "tenant-alpha" },
      method: "DELETE",
      url: `/core/common/location/cities/${editableSeededCity.id}/force`
    });
    expect(seededCityDeleted.statusCode).toBe(409);

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
      const data = response.json().data as Array<Record<string, unknown>>;
      expect(Array.isArray(data), url).toBe(true);
      expect(Object.values(data[0] ?? {}).some((value) => value === "-"), `${url} protected seed`).toBe(true);
    }

    const seededGroupsResponse = await app.inject({
      headers: { "x-tenant-id": "tenant-alpha" },
      method: "GET",
      url: "/core/common/contacts/contact-groups"
    });
    const seededGroups = (seededGroupsResponse.json() as { data: Array<{ id: string; name: string }> }).data;
    expect(seededGroups[0]?.name).toBe("-");
    expect(seededGroups.map((record) => record.name)).toEqual(expect.arrayContaining(["-", "Business", "Web Clients"]));

    const seededTypesResponse = await app.inject({
      headers: { "x-tenant-id": "tenant-alpha" },
      method: "GET",
      url: "/core/common/contacts/contact-types"
    });
    const seededTypes = (seededTypesResponse.json() as { data: Array<{ name: string }> }).data;
    expect(seededTypes[0]?.name).toBe("-");
    expect(seededTypes.map((record) => record.name)).toEqual(expect.arrayContaining([
      "-", "Customer", "Supplier", "Vendor Customer", "Staff", "Employee"
    ]));

    const seededBanksResponse = await app.inject({
      headers: { "x-tenant-id": "tenant-alpha" },
      method: "GET",
      url: "/core/common/contacts/bank-names"
    });
    const seededBanks = (seededBanksResponse.json() as { data: Array<{ name: string }> }).data;
    expect(seededBanks.length).toBeGreaterThan(140);
    expect(seededBanks[0]?.name).toBe("-");
    expect(seededBanks.map((record) => record.name)).toEqual(expect.arrayContaining([
      "State Bank of India",
      "HDFC Bank Limited",
      "Tamil Nadu Grama Bank",
      "Airtel Payments Bank Limited",
      "Standard Chartered Bank",
      "Tamil Nadu State Apex Co-operative Bank Limited"
    ]));
    expect(seededBanks.some((record) => record.name === "Paytm Payments Bank Limited")).toBe(false);

    const seededCurrenciesResponse = await app.inject({
      headers: { "x-tenant-id": "tenant-alpha" },
      method: "GET",
      url: "/core/common/others/currencies"
    });
    const seededCurrencies = (seededCurrenciesResponse.json() as {
      data: Array<{ name: string; symbol: string }>
    }).data;
    expect(seededCurrencies.find((record) => record.name === "INR")?.symbol).toBe("₹");
    expect(seededCurrencies.find((record) => record.name === "USD")?.symbol).toBe("$");

    const accountingMonthsResponse = await app.inject({
      headers: { "x-tenant-id": "tenant-alpha" },
      method: "GET",
      url: "/core/common/others/months"
    });
    const accountingMonths = (accountingMonthsResponse.json() as {
      data: Array<{ fromDate: string; name: string; toDate: string }>
    }).data;
    expect(accountingMonths.find((record) => record.name === "April-2026")).toMatchObject({
      fromDate: "2026-04-01",
      toDate: "2026-04-30"
    });
    expect(accountingMonths.find((record) => record.name === "March-2027")).toMatchObject({
      fromDate: "2027-03-01",
      toDate: "2027-03-31"
    });

    const businessGroup = seededGroups.find((record) => record.name === "Business");
    const placeholderGroup = seededGroups.find((record) => record.name === "-");
    if (!businessGroup || !placeholderGroup) throw new Error("Expected seeded contact groups.");

    const businessGroupUpdated = await app.inject({
      headers: { "x-tenant-id": "tenant-alpha" },
      method: "PUT",
      payload: { isActive: true, name: "Business Contacts", sortOrder: 2 },
      url: `/core/common/contacts/contact-groups/${businessGroup.id}`
    });
    expect((businessGroupUpdated.json() as { data: { name: string; tenantId: string } }).data)
      .toMatchObject({ name: "Business Contacts", tenantId: "global" });

    const placeholderGroupUpdate = await app.inject({
      headers: { "x-tenant-id": "tenant-alpha" },
      method: "PUT",
      payload: { isActive: true, name: "Changed", sortOrder: 1 },
      url: `/core/common/contacts/contact-groups/${placeholderGroup.id}`
    });
    expect((placeholderGroupUpdate.json() as { data: null }).data).toBeNull();

    const businessGroupDeleted = await app.inject({
      headers: { "x-tenant-id": "tenant-alpha" },
      method: "DELETE",
      url: `/core/common/contacts/contact-groups/${businessGroup.id}/force`
    });
    expect((businessGroupDeleted.json() as { data: { name: string } }).data.name).toBe("Business Contacts");

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
  }, 120000);
});
