import { MasterRepository } from "../../master/master.repository.js";
import { sql } from "kysely";
import { getCoreDatabase } from "../../../database/core-database.js";
import type { MasterSaveInput } from "../../master/foundation/master.types.js";
import { companyDefinition } from "./company.definition.js";

export type CompanyIndustry = { code: string; id: string; name: string };

export class CompanyRepository extends MasterRepository {
  constructor() { super(companyDefinition); }

  async create(tenantId: string, input: MasterSaveInput) {
    return super.create(tenantId, await this.withIndustry(input));
  }

  async update(tenantId: string, id: string, input: MasterSaveInput) {
    return super.update(tenantId, id, await this.withIndustry(input));
  }

  async listIndustries(): Promise<CompanyIndustry[]> {
    if (!await industriesTableExists()) return [];
    const result = await sql<{ code: string; id: number | string; name: string }>`
      SELECT id, code, name
      FROM industries
      WHERE status = 'active'
      ORDER BY name ASC
    `.execute(getCoreDatabase());
    return result.rows.map((industry) => ({ code: String(industry.code), id: String(industry.id), name: String(industry.name) }));
  }

  private async withIndustry(input: MasterSaveInput): Promise<MasterSaveInput> {
    const industryId = String(input.industryId ?? "").trim();
    if (!industryId) return { ...input, industryId: null, industryName: null };
    if (!await industriesTableExists()) throw new Error("Industry lookup is not available.");
    const industry = await sql<{ code: string; id: number | string; name: string }>`
      SELECT id, code, name
      FROM industries
      WHERE id = ${industryId} AND status = 'active'
      LIMIT 1
    `.execute(getCoreDatabase());
    const record = industry.rows[0];
    if (!record) throw new Error("Select an active industry.");
    return { ...input, industryId: String(record.id), industryName: String(record.name) };
  }
}

async function industriesTableExists() {
  const result = await sql<{ count: number }>`
    SELECT COUNT(*) AS count
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'industries'
  `.execute(getCoreDatabase());
  return Number(result.rows[0]?.count ?? 0) > 0;
}
