import { contactGroupsDefinition } from "./contacts/contact-groups/contact-groups.definition";
import { contactTypesDefinition } from "./contacts/contact-types/contact-types.definition";
import { addressTypesDefinition } from "./contacts/address-types/address-types.definition";
import { bankNamesDefinition } from "./contacts/bank-names/bank-names.definition";
import { productGroupsDefinition } from "./products/product-groups/product-groups.definition";
import { productCategoriesDefinition } from "./products/product-categories/product-categories.definition";
import { productTypesDefinition } from "./products/product-types/product-types.definition";
import { unitsDefinition } from "./products/units/units.definition";
import { hsnCodesDefinition } from "./products/hsn-codes/hsn-codes.definition";
import { taxesDefinition } from "./products/taxes/taxes.definition";
import { brandsDefinition } from "./products/brands/brands.definition";
import { coloursDefinition } from "./products/colours/colours.definition";
import { sizesDefinition } from "./products/sizes/sizes.definition";
import { stylesDefinition } from "./products/styles/styles.definition";
import { workOrderTypesDefinition } from "./workorder/work-order-types/work-order-types.definition";
import { transportsDefinition } from "./workorder/transports/transports.definition";
import { warehousesDefinition } from "./workorder/warehouses/warehouses.definition";
import { destinationsDefinition } from "./workorder/destinations/destinations.definition";
import { stockRejectionTypesDefinition } from "./workorder/stock-rejection-types/stock-rejection-types.definition";
import { currenciesDefinition } from "./others/currencies/currencies.definition";
import { prioritiesDefinition } from "./others/priorities/priorities.definition";
import { paymentTermsDefinition } from "./others/payment-terms/payment-terms.definition";
import { salesTypesDefinition } from "./others/sales-types/sales-types.definition";
import { monthsDefinition } from "./others/months/months.definition";

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
