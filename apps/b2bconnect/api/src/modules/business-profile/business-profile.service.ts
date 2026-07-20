import { AppError } from "@codexsun/framework/errors";
import type { B2bConnectSession } from "../authentication/index.js";
import type { BusinessProfileRepository } from "./business-profile.repository.js";
import type {
  PublicBusinessProfile,
  ReviewBusinessProfileInput,
  SaveBusinessProfileInput
} from "./business-profile.types.js";

export class BusinessProfileService {
  constructor(private readonly repository: BusinessProfileRepository) {}
  ownProfile(session: B2bConnectSession) {
    return this.repository.findByOwner(session.email);
  }
  saveOwnProfile(session: B2bConnectSession, input: SaveBusinessProfileInput) {
    return this.repository.save(session.email, normalize(input));
  }
  administrationProfiles() {
    return this.repository.listAll();
  }
  superAdministrationProfiles() {
    return this.repository.listAll();
  }
  publicProfiles(): PublicBusinessProfile[] {
    return this.repository
      .listApproved()
      .map(({ ownerEmail: _ownerEmail, reviewNote: _reviewNote, ...profile }) => profile);
  }
  reviewProfile(session: B2bConnectSession, uuid: string, input: ReviewBusinessProfileInput) {
    const profile = this.repository.findByUuid(uuid);
    if (!profile) throw AppError.notFound("Business profile not found.");
    if (profile.status !== "pending")
      throw AppError.conflict("Only pending profiles can be reviewed.");
    if (input.decision === "reject" && !input.note.trim())
      throw AppError.validation("A rejection note is required.");
    return this.repository.review(uuid, session.email, {
      decision: input.decision,
      note: input.note.trim()
    });
  }
}

function normalize(input: SaveBusinessProfileInput): SaveBusinessProfileInput {
  return {
    association: input.association,
    businessName: input.businessName.trim(),
    capacityNote: input.capacityNote.trim(),
    capabilities: [...new Set(input.capabilities.map((item) => item.trim()).filter(Boolean))].slice(
      0,
      12
    ),
    description: input.description.trim(),
    industrySegment: input.industrySegment.trim(),
    productsServices: input.productsServices.trim(),
    whatsappEnabled: input.whatsappEnabled,
    whatsappNumber: input.whatsappNumber.trim()
  };
}
