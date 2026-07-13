import type { Kysely } from "kysely";
import type { CoreDatabase } from "../../database/core-database.js";
import { migrateLocationModules } from "./location/location.migration.js";
import { migrateAddressTypes } from "./contacts/address-types/address-types.migration.js";
import { migrateBankNames } from "./contacts/bank-names/bank-names.migration.js";
import { migrateContactGroups } from "./contacts/contact-groups/contact-groups.migration.js";
import { migrateContactTypes } from "./contacts/contact-types/contact-types.migration.js";
import { migrateCurrencies } from "./others/currencies/currencies.migration.js";
import { migrateMonths } from "./others/months/months.migration.js";
import { migratePaymentTerms } from "./others/payment-terms/payment-terms.migration.js";
import { migratePriorities } from "./others/priorities/priorities.migration.js";
import { migrateSalesTypes } from "./others/sales-types/sales-types.migration.js";
import { migrateBrands } from "./products/brands/brands.migration.js";
import { migrateColours } from "./products/colours/colours.migration.js";
import { migrateHsnCodes } from "./products/hsn-codes/hsn-codes.migration.js";
import { migrateProductCategories } from "./products/product-categories/product-categories.migration.js";
import { migrateProductGroups } from "./products/product-groups/product-groups.migration.js";
import { migrateProductTypes } from "./products/product-types/product-types.migration.js";
import { migrateSizes } from "./products/sizes/sizes.migration.js";
import { migrateStyles } from "./products/styles/styles.migration.js";
import { migrateTaxes } from "./products/taxes/taxes.migration.js";
import { migrateUnits } from "./products/units/units.migration.js";
import { migrateDestinations } from "./workorder/destinations/destinations.migration.js";
import { migrateStockRejectionTypes } from "./workorder/stock-rejection-types/stock-rejection-types.migration.js";
import { migrateTransports } from "./workorder/transports/transports.migration.js";
import { migrateWarehouses } from "./workorder/warehouses/warehouses.migration.js";
import { migrateWorkOrderTypes } from "./workorder/work-order-types/work-order-types.migration.js";
import { migrateLedgerGroups } from "./accounts/ledger-groups/ledger-groups.migration.js";
import { migrateLedgers } from "./accounts/ledgers/ledgers.migration.js";

export const commonMigration = {
  description: "Common module aggregator migrations.",
  key: "core.common"
};
export async function migrateCommonModule(database: Kysely<CoreDatabase>) {
  await migrateLocationModules(database);
  await migrateLedgerGroups(database);
  await migrateLedgers(database);
  await migrateAddressTypes(database);
  await migrateBankNames(database);
  await migrateContactGroups(database);
  await migrateContactTypes(database);
  await migrateCurrencies(database);
  await migrateMonths(database);
  await migratePaymentTerms(database);
  await migratePriorities(database);
  await migrateSalesTypes(database);
  await migrateBrands(database);
  await migrateColours(database);
  await migrateHsnCodes(database);
  await migrateProductCategories(database);
  await migrateProductGroups(database);
  await migrateProductTypes(database);
  await migrateSizes(database);
  await migrateStyles(database);
  await migrateTaxes(database);
  await migrateUnits(database);
  await migrateDestinations(database);
  await migrateStockRejectionTypes(database);
  await migrateTransports(database);
  await migrateWarehouses(database);
  await migrateWorkOrderTypes(database);
}
