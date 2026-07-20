import { randomBytes } from "node:crypto";
import type { B2bConnectDatabase } from "../../database.js";
import type {
  BusinessProfile,
  ReviewBusinessProfileInput,
  SaveBusinessProfileInput
} from "./business-profile.types.js";

type BusinessProfileRow = {
  association: string;
  business_name: string;
  capacity_note: string;
  capabilities_json: string;
  created_at: string;
  description: string;
  industry_segment: string;
  owner_email: string;
  products_services: string;
  published_at: string | null;
  review_note: string;
  status: string;
  updated_at: string;
  uuid: string;
  whatsapp_enabled: number;
  whatsapp_number: string;
};

export class BusinessProfileRepository {
  constructor(private readonly database: B2bConnectDatabase) {}

  findByOwner(ownerEmail: string) {
    const row = this.database
      .prepare("SELECT * FROM b2b_business_profiles WHERE owner_email = ?")
      .get(ownerEmail) as BusinessProfileRow | undefined;
    return row ? mapRow(row) : null;
  }

  findByUuid(uuid: string) {
    const row = this.database
      .prepare("SELECT * FROM b2b_business_profiles WHERE uuid = ?")
      .get(uuid) as BusinessProfileRow | undefined;
    return row ? mapRow(row) : null;
  }

  listAll() {
    return (
      this.database
        .prepare("SELECT * FROM b2b_business_profiles ORDER BY updated_at DESC")
        .all() as BusinessProfileRow[]
    ).map(mapRow);
  }

  listApproved() {
    return (
      this.database
        .prepare(
          "SELECT * FROM b2b_business_profiles WHERE status = 'approved' ORDER BY published_at DESC"
        )
        .all() as BusinessProfileRow[]
    ).map(mapRow);
  }

  save(ownerEmail: string, input: SaveBusinessProfileInput) {
    return this.transaction(() => {
      const existing = this.findByOwner(ownerEmail);
      const now = new Date().toISOString();
      if (existing) {
        this.database
          .prepare(
            `UPDATE b2b_business_profiles SET business_name = ?, industry_segment = ?, description = ?, products_services = ?, capacity_note = ?, capabilities_json = ?, association = ?, whatsapp_number = ?, whatsapp_enabled = ?, status = 'pending', review_note = '', published_at = NULL, updated_at = ? WHERE owner_email = ?`
          )
          .run(
            input.businessName,
            input.industrySegment,
            input.description,
            input.productsServices,
            input.capacityNote,
            JSON.stringify(input.capabilities),
            input.association,
            input.whatsappNumber,
            input.whatsappEnabled ? 1 : 0,
            now,
            ownerEmail
          );
        this.recordActivity(existing.uuid, ownerEmail, "resubmitted", now);
        return this.findByOwner(ownerEmail)!;
      }
      const uuid = this.nextUuid();
      this.database
        .prepare(
          `INSERT INTO b2b_business_profiles (uuid, owner_email, business_name, industry_segment, description, products_services, capacity_note, capabilities_json, association, whatsapp_number, whatsapp_enabled, status, review_note, published_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', '', NULL, ?, ?)`
        )
        .run(
          uuid,
          ownerEmail,
          input.businessName,
          input.industrySegment,
          input.description,
          input.productsServices,
          input.capacityNote,
          JSON.stringify(input.capabilities),
          input.association,
          input.whatsappNumber,
          input.whatsappEnabled ? 1 : 0,
          now,
          now
        );
      this.recordActivity(uuid, ownerEmail, "submitted", now);
      return this.findByOwner(ownerEmail)!;
    });
  }

  review(uuid: string, reviewerEmail: string, input: ReviewBusinessProfileInput) {
    return this.transaction(() => {
      const now = new Date().toISOString();
      const status = input.decision === "approve" ? "approved" : "rejected";
      this.database
        .prepare(
          "UPDATE b2b_business_profiles SET status = ?, review_note = ?, published_at = ?, updated_at = ? WHERE uuid = ?"
        )
        .run(status, input.note, status === "approved" ? now : null, now, uuid);
      this.database
        .prepare(
          "INSERT INTO b2b_business_profile_reviews (profile_uuid, reviewer_email, decision, note, created_at) VALUES (?, ?, ?, ?, ?)"
        )
        .run(uuid, reviewerEmail, input.decision, input.note, now);
      return this.findByUuid(uuid)!;
    });
  }

  private nextUuid() {
    for (;;) {
      const uuid = randomBytes(4).toString("hex");
      if (!this.findByUuid(uuid)) return uuid;
    }
  }

  private recordActivity(uuid: string, actorEmail: string, action: string, createdAt: string) {
    this.database
      .prepare(
        "INSERT INTO b2b_business_profile_activity (profile_uuid, actor_email, action, created_at) VALUES (?, ?, ?, ?)"
      )
      .run(uuid, actorEmail, action, createdAt);
  }

  private transaction<T>(operation: () => T) {
    this.database.exec("BEGIN");
    try {
      const result = operation();
      this.database.exec("COMMIT");
      return result;
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }
}

function mapRow(row: BusinessProfileRow): BusinessProfile {
  return {
    association: row.association as BusinessProfile["association"],
    businessName: row.business_name,
    capacityNote: row.capacity_note,
    capabilities: JSON.parse(row.capabilities_json) as string[],
    createdAt: row.created_at,
    description: row.description,
    industrySegment: row.industry_segment,
    ownerEmail: row.owner_email,
    productsServices: row.products_services,
    publishedAt: row.published_at,
    reviewNote: row.review_note,
    status: row.status as BusinessProfile["status"],
    updatedAt: row.updated_at,
    uuid: row.uuid,
    whatsappEnabled: row.whatsapp_enabled === 1,
    whatsappNumber: row.whatsapp_number
  };
}
