import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createConnection, type Connection, type RowDataPacket } from "mysql2/promise";
import { env as platformEnv } from "../../apps/platform/api/src/env.js";
import { closePlatformDatabase } from "../../apps/platform/api/src/database/platform-database.js";
import { closeAllTenantDatabases } from "../../apps/platform/api/src/database/tenant-database.js";
import { SubscriptionService } from "../../apps/platform/api/src/modules/subscription/subscription.service.js";
import { TenantService } from "../../apps/platform/api/src/modules/tenant/tenant.service.js";
import type { Tenant } from "../../apps/platform/api/src/modules/tenant/tenant.types.js";
import { signAuthToken } from "../../apps/platform/api/src/auth/jwt.js";
import {
  bootstrapCoreDatabase,
  closeCoreDatabase
} from "../../apps/core/api/src/database/core-database.js";
import {
  bootstrapBillingDatabase,
  closeAllBillingDatabases
} from "../../apps/billing/api/src/database/billing-database.js";
import { createApp as createBillingApp } from "../../apps/billing/api/src/app.js";
import { ExportSalesService } from "../../apps/billing/api/src/modules/export-sales/export-sales.service.js";
import type { ExportSaleSavePayload } from "../../apps/billing/api/src/modules/export-sales/export-sales.types.js";
import { PaymentService } from "../../apps/billing/api/src/modules/payment/payment.service.js";
import type { PaymentSavePayload } from "../../apps/billing/api/src/modules/payment/payment.types.js";
import { PurchaseService } from "../../apps/billing/api/src/modules/purchase/purchase.service.js";
import type { PurchaseSavePayload } from "../../apps/billing/api/src/modules/purchase/purchase.types.js";
import { QuotationService } from "../../apps/billing/api/src/modules/quotation/quotation.service.js";
import type { QuotationSavePayload } from "../../apps/billing/api/src/modules/quotation/quotation.types.js";
import { ReceiptService } from "../../apps/billing/api/src/modules/receipt/receipt.service.js";
import type { ReceiptSavePayload } from "../../apps/billing/api/src/modules/receipt/receipt.types.js";
import { SalesService } from "../../apps/billing/api/src/modules/sales/sales.service.js";
import type { SaleSavePayload } from "../../apps/billing/api/src/modules/sales/sales.types.js";

const recordsPerTenant = 12;
const runToken = Date.now().toString(36).slice(-6).toUpperCase();
const tenantDefinitions = [
  { code: "CODEXSUN", databaseName: "codexsun_db", name: "Codexsun" },
  { code: "LOAD01", databaseName: "codexsun_load_01", name: "Load Tenant 01" },
  { code: "LOAD02", databaseName: "codexsun_load_02", name: "Load Tenant 02" },
  { code: "LOAD03", databaseName: "codexsun_load_03", name: "Load Tenant 03" },
  { code: "LOAD04", databaseName: "codexsun_load_04", name: "Load Tenant 04" }
] as const;

const admin = await createConnection({
  host: platformEnv.DB_HOST,
  password: platformEnv.DB_PASSWORD,
  port: platformEnv.DB_PORT,
  timezone: "Z",
  user: platformEnv.DB_USER
});
const tenantService = new TenantService();
const subscriptionService = new SubscriptionService();
const quotationService = new QuotationService();
const salesService = new SalesService();
const purchaseService = new PurchaseService();
const exportSalesService = new ExportSalesService();
const paymentService = new PaymentService();
const receiptService = new ReceiptService();
let billingApp: Awaited<ReturnType<typeof createBillingApp>> | null = null;

try {
  const tenants = await provisionTenants();
  const generated = await Promise.all(tenants.map((tenant) => generateTenantLoad(tenant)));
  const databaseAudits = [];
  let tenantSchema: SchemaColumn[] | null = null;
  for (const tenant of tenants) {
    const audit = await auditDatabase(admin, tenant.dbName);
    assert.equal(audit.migrationCount, 19, `${tenant.tenantCode} migration ledger is incomplete.`);
    tenantSchema ??= audit.schema;
    assert.deepEqual(audit.schema, tenantSchema, `${tenant.tenantCode} schema drift was detected.`);
    databaseAudits.push(audit);
  }
  const masterAudit = await auditDatabase(admin, platformEnv.DB_MASTER_NAME);
  await admin.changeUser({ database: platformEnv.DB_MASTER_NAME });
  const [masterCounts] = await admin.query<Array<RowDataPacket & MasterCounts>>(`
    SELECT
      (SELECT COUNT(*) FROM tenants WHERE status='active') AS tenants,
      (SELECT COUNT(*) FROM tenant_domains domain
        INNER JOIN tenants tenant ON tenant.id=domain.tenant_id
        WHERE tenant.status='active') AS domains,
      (SELECT COUNT(*) FROM subscriptions WHERE status IN ('active','trial')) AS subscriptions
  `);
  assert.equal(Number(masterCounts[0]?.tenants), 5);
  assert.equal(Number(masterCounts[0]?.domains), 5);
  assert.equal(Number(masterCounts[0]?.subscriptions), 5);

  billingApp = await createBillingApp();
  const routeAudit = await verifyLiveRoutes(tenants, generated);
  assert.equal(
    routeAudit.mismatchedTenantAccepted,
    false,
    "Billing accepted a mismatched x-tenant-id and x-tenant-db pair."
  );

  await closeAllBillingDatabases();
  await closeCoreDatabase();
  for (const tenant of tenants) {
    await bootstrapCoreDatabase(tenant.dbName);
    await bootstrapBillingDatabase(tenant.dbName);
    assert.equal((await paymentService.list(tenant.dbName)).length >= recordsPerTenant, true);
    assert.equal((await receiptService.list(tenant.dbName)).length >= recordsPerTenant, true);
  }

  console.log("Live five-tenant mass E2E passed", {
    databaseAudits: databaseAudits.map(summarizeAudit),
    generated: generated.map((entry) => ({
      databaseName: entry.tenant.dbName,
      documents: recordsPerTenant * 6,
      tenantCode: entry.tenant.tenantCode
    })),
    masterAudit: summarizeAudit(masterAudit),
    recordsPerTenant,
    routeAudit,
    runToken,
    tenants: tenants.length,
    totalDocuments: tenants.length * recordsPerTenant * 6
  });
} finally {
  await billingApp?.close();
  await closeAllBillingDatabases();
  await closeCoreDatabase();
  await closeAllTenantDatabases();
  await closePlatformDatabase();
  await admin.end();
}

async function provisionTenants() {
  const existing = await tenantService.listTenants();
  const tenants: Tenant[] = [];
  await admin.changeUser({ database: platformEnv.DB_MASTER_NAME });
  const [plans] = await admin.query<Array<RowDataPacket & { id: number }>>(
    "SELECT id FROM plans WHERE code='starter' AND status='active' LIMIT 1"
  );
  const planId = Number(plans[0]?.id);
  assert.ok(planId, "Starter plan was not seeded.");

  for (const definition of tenantDefinitions) {
    let tenant = existing.find((entry) => entry.tenantCode === definition.code) ?? null;
    if (!tenant) {
      tenant = await tenantService.createTenant({
        corporateId: definition.code,
        dbHost: platformEnv.DB_HOST,
        dbName: definition.databaseName,
        dbPort: platformEnv.DB_PORT,
        dbSecretRef: "DB_PASSWORD",
        dbType: platformEnv.DB_DRIVER,
        dbUser: platformEnv.DB_USER,
        defaultLandingApp: "billing",
        enabledModuleKeys: ["platform.application", "billing.sales"],
        mobile: null,
        payloadSettings: {
          apps: { enabled: ["platform.application", "billing.sales"] },
          landing: { app: "billing", mode: "tenant" },
          seed: { source: "live-five-tenant-mass-e2e" }
        },
        primaryDomain: `${definition.code.toLowerCase()}.localhost`,
        slug: definition.code.toLowerCase(),
        status: "active",
        tenantCode: definition.code,
        tenantName: definition.name
      });
    }
    await admin.changeUser({ database: platformEnv.DB_MASTER_NAME });
    const [subscriptions] = await admin.query<Array<RowDataPacket & { id: number }>>(
      "SELECT id FROM subscriptions WHERE tenant_id=? AND status IN ('active','trial') LIMIT 1",
      [tenant.id]
    );
    if (!subscriptions.length) {
      await subscriptionService.createSubscription({
        billingCycle: "monthly",
        endsOn: null,
        planId,
        startsOn: new Date().toISOString().slice(0, 10),
        status: "active",
        tenantId: tenant.id
      });
    }
    const refreshed = await tenantService.getTenant(String(tenant.id));
    assert.ok(refreshed, `${definition.code} could not be reloaded.`);
    await bootstrapCoreDatabase(refreshed.dbName);
    await bootstrapBillingDatabase(refreshed.dbName);
    tenants.push(refreshed);
  }
  return tenants;
}

async function generateTenantLoad(tenant: Tenant) {
  const tenantConnection = await createConnection({
    database: tenant.dbName,
    host: platformEnv.DB_HOST,
    password: platformEnv.DB_PASSWORD,
    port: platformEnv.DB_PORT,
    timezone: "Z",
    user: platformEnv.DB_USER
  });
  try {
    await createMassReferences(tenantConnection, tenant);
    const references = await loadReferences(tenantConnection, tenant);
    const firstIds: { payment?: string; quotation?: string; receipt?: string } = {};

    for (let index = 1; index <= recordsPerTenant; index += 1) {
      const quotation = await quotationService.create(
        tenant.dbName,
        quotationPayload(references, tenant, index)
      );
      await quotationService.confirm(tenant.dbName, quotation.id);

      const sale = await salesService.createSale(
        tenant.dbName,
        salePayload(references, tenant, index)
      );
      await salesService.confirmSale(tenant.dbName, sale.id);

      const purchase = await purchaseService.create(
        tenant.dbName,
        purchasePayload(references, tenant, index)
      );
      await purchaseService.confirm(tenant.dbName, purchase.id);

      const exportSale = await exportSalesService.createExportSale(
        tenant.dbName,
        exportSalePayload(references, tenant, index)
      );
      await exportSalesService.confirmExportSale(tenant.dbName, exportSale.id);

      const payment = await paymentService.create(
        tenant.dbName,
        paymentPayload(references, tenant, index, purchase.id, purchase.amount)
      );
      await paymentService.post(tenant.dbName, payment.id);

      const receipt = await receiptService.create(
        tenant.dbName,
        receiptPayload(references, tenant, index, sale.id, sale.amount)
      );
      await receiptService.post(tenant.dbName, receipt.id);

      if (index % 6 === 0) {
        await paymentService.cancel(tenant.dbName, payment.id);
        await receiptService.cancel(tenant.dbName, receipt.id);
      }
      firstIds.payment ??= payment.id;
      firstIds.quotation ??= quotation.id;
      firstIds.receipt ??= receipt.id;
    }

    const counts = await loadBillingCounts(tenantConnection, tenant.dbName);
    for (const count of Object.values(counts)) assert.ok(count >= recordsPerTenant);
    return { counts, firstIds, tenant };
  } finally {
    await tenantConnection.end();
  }
}

async function createMassReferences(connection: Connection, tenant: Tenant) {
  const token = stableId(tenant.uuid);
  await connection.query(`
    INSERT INTO contacts (uuid,code,name,status)
    VALUES ('${token.slice(0, 8)}','C-MASS','${tenant.tenantName} Mass Contact','active')
    ON DUPLICATE KEY UPDATE name=VALUES(name),status='active'
  `);
  await connection.query(`
    INSERT INTO contacts_addresses (parent_id,address_line1,is_default,sort_order)
    SELECT id,'${tenant.tenantCode} Mass Address',1,1 FROM contacts WHERE code='C-MASS'
      AND NOT EXISTS (SELECT 1 FROM contacts_addresses a WHERE a.parent_id=contacts.id AND a.is_default=1)
  `);
  await connection.query(`
    INSERT INTO work_orders (uuid,code,name,status)
    VALUES ('${stableId(`${tenant.uuid}:work`)}','WO-MASS','${tenant.tenantName} Mass Work Order','active')
    ON DUPLICATE KEY UPDATE name=VALUES(name),status='active'
  `);
  await connection.query(`
    INSERT INTO products (uuid,name,hsn_code_id,unit_id,gst_tax_id,status)
    SELECT '${stableId(`${tenant.uuid}:product`)}','${tenant.tenantName} Mass Product',
      (SELECT id FROM hsn_codes WHERE status='active' AND code<>'-' ORDER BY id LIMIT 1),
      (SELECT id FROM units WHERE status='active' AND LOWER(name)='nos' LIMIT 1),
      (SELECT id FROM taxes WHERE status='active' AND rate_percent=18 LIMIT 1),'active'
    FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM products WHERE uuid='${stableId(`${tenant.uuid}:product`)}')
  `);
}

async function loadReferences(connection: Connection, tenant: Tenant): Promise<References> {
  const [rows] = await connection.query<Array<RowDataPacket & ReferenceRow>>(`
    SELECT defaults.company_id,defaults.financial_year_id,
      DATE_FORMAT(financial_year.start_date,'%Y-%m-%d') AS document_date,
      currency.id AS currency_id,contact.id AS contact_id,address.id AS address_id,
      work_order.id AS work_order_id,ledger.id AS ledger_id,product.id AS product_id,
      hsn.id AS hsn_code_id,colour.id AS colour_id,size.id AS size_id,
      unit.id AS unit_id,tax.id AS tax_id
    FROM default_company_settings defaults
    INNER JOIN financial_years financial_year ON financial_year.id=defaults.financial_year_id
    INNER JOIN currencies currency ON UPPER(currency.name)='INR' AND currency.status='active'
    INNER JOIN contacts contact ON contact.code='C-MASS'
    INNER JOIN contacts_addresses address ON address.parent_id=contact.id AND address.is_default=1
    INNER JOIN work_orders work_order ON work_order.code='WO-MASS'
    INNER JOIN ledgers ledger ON ledger.status='active' AND ledger.name<>'-'
    INNER JOIN products product ON product.uuid='${stableId(`${tenant.uuid}:product`)}'
    INNER JOIN hsn_codes hsn ON hsn.id=product.hsn_code_id
    INNER JOIN colours colour ON colour.status='active' AND colour.name<>'-'
    INNER JOIN sizes size ON size.status='active' AND size.name<>'-'
    INNER JOIN units unit ON unit.id=product.unit_id
    INNER JOIN taxes tax ON tax.id=product.gst_tax_id
    WHERE defaults.singleton_key=1 LIMIT 1
  `);
  const row = rows[0];
  assert.ok(row, `${tenant.tenantCode} did not provide the required mass-data references.`);
  return {
    addressId: Number(row.address_id),
    colourId: Number(row.colour_id),
    companyId: Number(row.company_id),
    contactId: Number(row.contact_id),
    currencyId: Number(row.currency_id),
    documentDate: String(row.document_date),
    financialYearId: Number(row.financial_year_id),
    hsnCodeId: Number(row.hsn_code_id),
    ledgerId: Number(row.ledger_id),
    productId: Number(row.product_id),
    sizeId: Number(row.size_id),
    taxId: Number(row.tax_id),
    unitId: Number(row.unit_id),
    workOrderId: Number(row.work_order_id)
  };
}

function documentBase(references: References, tenant: Tenant, index: number) {
  return {
    billingAddress: `${tenant.tenantCode} Mass Address`,
    billingAddressId: references.addressId,
    companyId: references.companyId,
    currencyCode: "INR",
    currencyId: references.currencyId,
    customerEmail: `mass-${tenant.tenantCode.toLowerCase()}@example.test`,
    customerId: references.contactId,
    customerName: `${tenant.tenantName} Mass Contact`,
    customerPhone: `90000${String(index).padStart(5, "0")}`,
    financialYearId: references.financialYearId,
    items: [
      {
        colour: "Blue",
        colourId: references.colourId,
        description: `${tenant.tenantName} Mass Product ${index}`,
        hsnCode: "MASS",
        hsnCodeId: references.hsnCodeId,
        productId: references.productId,
        productName: `${tenant.tenantName} Mass Product`,
        quantity: 2,
        rate: 100 + index,
        size: "M",
        sizeId: references.sizeId,
        taxId: references.taxId,
        taxRate: 18,
        unit: "Nos",
        unitId: references.unitId
      }
    ],
    ledgerId: references.ledgerId,
    notes: `Live mass E2E ${runToken}`,
    roundOff: 0,
    salesLedger: "General Ledger",
    shippingAddress: `${tenant.tenantCode} Mass Address`,
    shippingAddressId: references.addressId,
    status: "draft" as const,
    taxType: "cgst-sgst" as const,
    terms: "Live mass E2E terms",
    workOrderId: references.workOrderId,
    workOrderNo: "WO-MASS"
  };
}

function quotationPayload(
  references: References,
  tenant: Tenant,
  index: number
): QuotationSavePayload {
  return {
    ...documentBase(references, tenant, index),
    date: references.documentDate,
    quotationNumber: number("QT", tenant, index)
  };
}

function salePayload(references: References, tenant: Tenant, index: number): SaleSavePayload {
  return {
    ...documentBase(references, tenant, index),
    invoiceNumber: number("INV", tenant, index),
    issuedOn: references.documentDate
  };
}

function purchasePayload(
  references: References,
  tenant: Tenant,
  index: number
): PurchaseSavePayload {
  const base = documentBase(references, tenant, index);
  return {
    ...base,
    invoiceNumber: number("PUR", tenant, index),
    issuedOn: references.documentDate,
    supplierBillDate: references.documentDate,
    supplierBillNo: number("SB", tenant, index),
    supplierEmail: base.customerEmail,
    supplierId: references.contactId,
    supplierName: base.customerName,
    supplierPhone: base.customerPhone
  };
}

function exportSalePayload(
  references: References,
  tenant: Tenant,
  index: number
): ExportSaleSavePayload {
  return {
    ...documentBase(references, tenant, index),
    invoiceNumber: number("EXP", tenant, index),
    issuedOn: references.documentDate
  };
}

function paymentPayload(
  references: References,
  tenant: Tenant,
  index: number,
  purchaseId: string,
  amount: number
): PaymentSavePayload {
  return {
    allocations: [{ allocatedAmount: amount, purchaseId }],
    amount,
    companyId: references.companyId,
    currencyId: references.currencyId,
    discountAmount: 0,
    financialYearId: references.financialYearId,
    ledgerId: references.ledgerId,
    notes: `Live mass payment ${runToken}`,
    paymentDate: references.documentDate,
    paymentMode: "bank",
    paymentNumber: number("PAY", tenant, index),
    referenceDate: references.documentDate,
    referenceNo: number("PREF", tenant, index),
    roundOff: 0,
    supplierId: references.contactId,
    tdsAmount: 0
  };
}

function receiptPayload(
  references: References,
  tenant: Tenant,
  index: number,
  saleId: string,
  amount: number
): ReceiptSavePayload {
  return {
    allocations: [{ allocatedAmount: amount, saleId }],
    amount,
    companyId: references.companyId,
    currencyId: references.currencyId,
    customerId: references.contactId,
    discountAmount: 0,
    financialYearId: references.financialYearId,
    ledgerId: references.ledgerId,
    notes: `Live mass receipt ${runToken}`,
    receiptDate: references.documentDate,
    receiptMode: "bank",
    receiptNumber: number("REC", tenant, index),
    referenceDate: references.documentDate,
    referenceNo: number("RREF", tenant, index),
    roundOff: 0,
    tdsAmount: 0
  };
}

async function verifyLiveRoutes(
  tenants: Tenant[],
  generated: Array<Awaited<ReturnType<typeof generateTenantLoad>>>
) {
  assert.ok(billingApp);
  for (const tenant of tenants) {
    const response = await billingApp.inject({
      headers: tenantHeaders(tenant),
      method: "GET",
      url: "/billing/payments"
    });
    assert.equal(response.statusCode, 200, response.body);
    assert.ok((response.json() as { data: unknown[] }).data.length >= recordsPerTenant);
  }
  const source = generated[0];
  const target = tenants[1];
  assert.ok(source?.firstIds.payment && target);
  const isolated = await billingApp.inject({
    headers: tenantHeaders(target),
    method: "GET",
    url: `/billing/payments/${source.firstIds.payment}`
  });
  assert.equal(isolated.statusCode, 404, isolated.body);
  const mismatched = await billingApp.inject({
    headers: {
      ...tenantHeaders(target),
      "x-tenant-db": source.tenant.dbName
    },
    method: "GET",
    url: "/billing/payments"
  });
  return {
    crossTenantRecordStatus: isolated.statusCode,
    mismatchedTenantAccepted: mismatched.statusCode === 200
  };
}

function tenantHeaders(tenant: Tenant) {
  const token = signAuthToken({
    email: `mass-${tenant.tenantCode.toLowerCase()}@example.test`,
    tenantCode: tenant.tenantCode,
    tenantDbName: tenant.dbName,
    tenantId: tenant.uuid,
    tenantUuid: tenant.uuid,
    userId: `mass-${tenant.uuid}`,
    userType: "tenant"
  });
  return {
    authorization: `Bearer ${token}`,
    "x-tenant-db": tenant.dbName,
    "x-tenant-id": tenant.uuid
  };
}

async function loadBillingCounts(connection: Connection, databaseName: string) {
  await connection.changeUser({ database: databaseName });
  const [rows] = await connection.query<Array<RowDataPacket & BillingCounts>>(`
    SELECT
      (SELECT COUNT(*) FROM billing_quotations WHERE deleted_at IS NULL) AS quotations,
      (SELECT COUNT(*) FROM billing_sales WHERE deleted_at IS NULL) AS sales,
      (SELECT COUNT(*) FROM billing_purchases WHERE deleted_at IS NULL) AS purchases,
      (SELECT COUNT(*) FROM billing_export_sales WHERE deleted_at IS NULL) AS export_sales,
      (SELECT COUNT(*) FROM billing_payments WHERE deleted_at IS NULL) AS payments,
      (SELECT COUNT(*) FROM billing_receipts WHERE deleted_at IS NULL) AS receipts
  `);
  const row = rows[0];
  assert.ok(row);
  return {
    exportSales: Number(row.export_sales),
    payments: Number(row.payments),
    purchases: Number(row.purchases),
    quotations: Number(row.quotations),
    receipts: Number(row.receipts),
    sales: Number(row.sales)
  };
}

async function auditDatabase(connection: Connection, databaseName: string): Promise<DatabaseAudit> {
  assert.match(databaseName, /^[a-zA-Z0-9_]+$/);
  await connection.changeUser({ database: databaseName });
  const [tableRows] = await connection.query<Array<RowDataPacket & { table_name: string }>>(
    "SELECT TABLE_NAME AS table_name FROM information_schema.TABLES WHERE TABLE_SCHEMA=? AND TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME",
    [databaseName]
  );
  const rowCounts: Record<string, number> = {};
  for (const { table_name: tableName } of tableRows) {
    assert.match(tableName, /^[a-zA-Z0-9_]+$/);
    const [countRows] = await connection.query<Array<RowDataPacket & { row_count: number }>>(
      `SELECT COUNT(*) AS row_count FROM \`${tableName}\``
    );
    rowCounts[tableName] = Number(countRows[0]?.row_count ?? 0);
    const [checks] = await connection.query<Array<RowDataPacket & { Msg_text: string }>>(
      `CHECK TABLE \`${tableName}\` QUICK`
    );
    assert.equal(checks.at(-1)?.Msg_text, "OK", `${databaseName}.${tableName} check failed.`);
  }
  const [foreignKeys] = await connection.query<Array<RowDataPacket & ForeignKeyRow>>(
    `SELECT TABLE_NAME AS table_name,COLUMN_NAME AS column_name,
      REFERENCED_TABLE_NAME AS referenced_table_name,REFERENCED_COLUMN_NAME AS referenced_column_name
     FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA=? AND REFERENCED_TABLE_NAME IS NOT NULL
     ORDER BY TABLE_NAME,CONSTRAINT_NAME,ORDINAL_POSITION`,
    [databaseName]
  );
  for (const foreignKey of foreignKeys) {
    for (const value of Object.values(foreignKey)) assert.match(String(value), /^[a-zA-Z0-9_]+$/);
    const [orphans] = await connection.query<Array<RowDataPacket & { orphan_count: number }>>(`
      SELECT COUNT(*) AS orphan_count
      FROM \`${foreignKey.table_name}\` child
      LEFT JOIN \`${foreignKey.referenced_table_name}\` parent
        ON parent.\`${foreignKey.referenced_column_name}\`=child.\`${foreignKey.column_name}\`
      WHERE child.\`${foreignKey.column_name}\` IS NOT NULL
        AND parent.\`${foreignKey.referenced_column_name}\` IS NULL
    `);
    assert.equal(Number(orphans[0]?.orphan_count ?? 0), 0, `${databaseName} has orphan rows.`);
  }
  const [schema] = await connection.query<Array<RowDataPacket & SchemaColumn>>(
    `SELECT TABLE_NAME AS tableName,COLUMN_NAME AS columnName,COLUMN_TYPE AS columnType,
      IS_NULLABLE AS isNullable,COALESCE(COLUMN_DEFAULT,'<null>') AS columnDefault,
      EXTRA AS extra,ORDINAL_POSITION AS ordinalPosition
     FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? ORDER BY TABLE_NAME,ORDINAL_POSITION`,
    [databaseName]
  );
  return {
    databaseName,
    emptyTables: Object.entries(rowCounts)
      .filter(([, count]) => count === 0)
      .map(([tableName]) => tableName),
    foreignKeys: foreignKeys.length,
    migrationCount: rowCounts.schema_migrations ?? 0,
    rowCounts,
    schema,
    tables: tableRows.length
  };
}

function summarizeAudit(audit: DatabaseAudit) {
  return {
    databaseName: audit.databaseName,
    emptyTables: audit.emptyTables,
    foreignKeys: audit.foreignKeys,
    migrationCount: audit.migrationCount,
    rows: Object.values(audit.rowCounts).reduce((sum, count) => sum + count, 0),
    tables: audit.tables
  };
}

function number(prefix: string, tenant: Tenant, index: number) {
  return `${prefix}-${tenant.tenantCode}-${runToken}-${String(index).padStart(3, "0")}`;
}

function stableId(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 8);
}

type References = {
  addressId: number;
  colourId: number;
  companyId: number;
  contactId: number;
  currencyId: number;
  documentDate: string;
  financialYearId: number;
  hsnCodeId: number;
  ledgerId: number;
  productId: number;
  sizeId: number;
  taxId: number;
  unitId: number;
  workOrderId: number;
};
type ReferenceRow = {
  address_id: number;
  colour_id: number;
  company_id: number;
  contact_id: number;
  currency_id: number;
  document_date: string;
  financial_year_id: number;
  hsn_code_id: number;
  ledger_id: number;
  product_id: number;
  size_id: number;
  tax_id: number;
  unit_id: number;
  work_order_id: number;
};
type MasterCounts = { domains: number; subscriptions: number; tenants: number };
type BillingCounts = {
  export_sales: number;
  payments: number;
  purchases: number;
  quotations: number;
  receipts: number;
  sales: number;
};
type ForeignKeyRow = {
  column_name: string;
  referenced_column_name: string;
  referenced_table_name: string;
  table_name: string;
};
type SchemaColumn = {
  columnDefault: string;
  columnName: string;
  columnType: string;
  extra: string;
  isNullable: string;
  ordinalPosition: number;
  tableName: string;
};
type DatabaseAudit = {
  databaseName: string;
  emptyTables: string[];
  foreignKeys: number;
  migrationCount: number;
  rowCounts: Record<string, number>;
  schema: SchemaColumn[];
  tables: number;
};
