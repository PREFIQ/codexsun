import { contactGroupsDefinition } from "./contacts/contact-groups/contact-groups.types";
import { contactTypesDefinition } from "./contacts/contact-types/contact-types.types";
import { addressTypesDefinition } from "./contacts/address-types/address-types.types";
import { bankNamesDefinition } from "./contacts/bank-names/bank-names.types";
import { productGroupsDefinition } from "./products/product-groups/product-groups.types";
import { productCategoriesDefinition } from "./products/product-categories/product-categories.types";
import { productTypesDefinition } from "./products/product-types/product-types.types";
import { unitsDefinition } from "./products/units/units.types";
import { hsnCodesDefinition } from "./products/hsn-codes/hsn-codes.types";
import { taxesDefinition } from "./products/taxes/taxes.types";
import { brandsDefinition } from "./products/brands/brands.types";
import { coloursDefinition } from "./products/colours/colours.types";
import { sizesDefinition } from "./products/sizes/sizes.types";
import { stylesDefinition } from "./products/styles/styles.types";
import { workOrderTypesDefinition } from "./workorder/work-order-types/work-order-types.types";
import { transportsDefinition } from "./workorder/transports/transports.types";
import { warehousesDefinition } from "./workorder/warehouses/warehouses.types";
import { destinationsDefinition } from "./workorder/destinations/destinations.types";
import { stockRejectionTypesDefinition } from "./workorder/stock-rejection-types/stock-rejection-types.types";
import { currenciesDefinition } from "./others/currencies/currencies.types";
import { prioritiesDefinition } from "./others/priorities/priorities.types";
import { paymentTermsDefinition } from "./others/payment-terms/payment-terms.types";
import { salesTypesDefinition } from "./others/sales-types/sales-types.types";
import { monthsDefinition } from "./others/months/months.types";

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
