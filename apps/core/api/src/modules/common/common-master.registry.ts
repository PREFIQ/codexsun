import { contactGroupsDefinition } from "./contacts/contact-groups/contact-groups.definition.js";
import { contactTypesDefinition } from "./contacts/contact-types/contact-types.definition.js";
import { addressTypesDefinition } from "./contacts/address-types/address-types.definition.js";
import { bankNamesDefinition } from "./contacts/bank-names/bank-names.definition.js";
import { productGroupsDefinition } from "./products/product-groups/product-groups.definition.js";
import { productCategoriesDefinition } from "./products/product-categories/product-categories.definition.js";
import { productTypesDefinition } from "./products/product-types/product-types.definition.js";
import { unitsDefinition } from "./products/units/units.definition.js";
import { hsnCodesDefinition } from "./products/hsn-codes/hsn-codes.definition.js";
import { taxesDefinition } from "./products/taxes/taxes.definition.js";
import { brandsDefinition } from "./products/brands/brands.definition.js";
import { coloursDefinition } from "./products/colours/colours.definition.js";
import { sizesDefinition } from "./products/sizes/sizes.definition.js";
import { stylesDefinition } from "./products/styles/styles.definition.js";
import { workOrderTypesDefinition } from "./workorder/work-order-types/work-order-types.definition.js";
import { transportsDefinition } from "./workorder/transports/transports.definition.js";
import { warehousesDefinition } from "./workorder/warehouses/warehouses.definition.js";
import { destinationsDefinition } from "./workorder/destinations/destinations.definition.js";
import { stockRejectionTypesDefinition } from "./workorder/stock-rejection-types/stock-rejection-types.definition.js";
import { currenciesDefinition } from "./others/currencies/currencies.definition.js";
import { prioritiesDefinition } from "./others/priorities/priorities.definition.js";
import { paymentTermsDefinition } from "./others/payment-terms/payment-terms.definition.js";
import { salesTypesDefinition } from "./others/sales-types/sales-types.definition.js";
import { monthsDefinition } from "./others/months/months.definition.js";

export const commonMasterDefinitions = [
  contactGroupsDefinition,
  contactTypesDefinition,
  addressTypesDefinition,
  bankNamesDefinition,
  productGroupsDefinition,
  productCategoriesDefinition,
  productTypesDefinition,
  unitsDefinition,
  hsnCodesDefinition,
  taxesDefinition,
  brandsDefinition,
  coloursDefinition,
  sizesDefinition,
  stylesDefinition,
  workOrderTypesDefinition,
  transportsDefinition,
  warehousesDefinition,
  destinationsDefinition,
  stockRejectionTypesDefinition,
  currenciesDefinition,
  prioritiesDefinition,
  paymentTermsDefinition,
  salesTypesDefinition,
  monthsDefinition
] as const;
