import type { BusinessProfileErrors, BusinessProfileValues } from "./business-profile.types";

export function validateBusinessProfile(values: BusinessProfileValues) {
  const errors: BusinessProfileErrors = {};
  if (values.businessName.trim().length < 2) errors.businessName = "Business name is required.";
  if (values.industrySegment.trim().length < 2)
    errors.industrySegment = "Industry segment is required.";
  if (values.description.trim().length < 20)
    errors.description = "Add at least 20 characters about the business.";
  if (values.productsServices.trim().length < 2)
    errors.productsServices = "Products or services are required.";
  if (values.whatsappEnabled && values.whatsappNumber.trim().length < 8)
    errors.whatsappNumber = "Add a valid WhatsApp number.";
  return errors;
}
