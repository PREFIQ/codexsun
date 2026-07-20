export type BusinessProfileStatus = "draft" | "pending" | "approved" | "rejected";
export type BusinessAssociation =
  "teama" | "taef" | "export-association" | "industrial-association" | "independent";

export type BusinessProfile = {
  association: BusinessAssociation;
  businessName: string;
  capacityNote: string;
  capabilities: string[];
  createdAt: string;
  description: string;
  industrySegment: string;
  ownerEmail: string;
  productsServices: string;
  publishedAt: string | null;
  reviewNote: string;
  status: BusinessProfileStatus;
  updatedAt: string;
  uuid: string;
  whatsappEnabled: boolean;
  whatsappNumber: string;
};
export type PublicBusinessProfile = Omit<BusinessProfile, "ownerEmail" | "reviewNote">;
export type BusinessProfileValues = Pick<
  BusinessProfile,
  | "association"
  | "businessName"
  | "capacityNote"
  | "description"
  | "industrySegment"
  | "productsServices"
  | "whatsappEnabled"
  | "whatsappNumber"
> & { capabilitiesText: string };
export type BusinessProfileErrors = Partial<Record<keyof BusinessProfileValues, string>>;
