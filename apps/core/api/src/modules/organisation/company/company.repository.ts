import { sql } from "kysely";
import { getCoreDatabase } from "../../../database/core-database.js";
import type { CompanyIndustry, CompanyRecord, CompanySaveInput } from "./company.types.js";
type Row = Record<string, unknown>;
export class CompanyRepository {
  async list(search = "") {
    const term = search.trim().toLowerCase();
    const rows =
      await sql<Row>`SELECT * FROM companies WHERE (${term}='' OR LOWER(name) LIKE ${`%${term}%`} OR LOWER(code) LIKE ${`%${term}%`}) ORDER BY code`.execute(
        getCoreDatabase()
      );
    return rows.rows.map(map);
  }
  async find(id: string | number) {
    const rows = await sql<Row>`SELECT * FROM companies WHERE id=${Number(id)} LIMIT 1`.execute(
      getCoreDatabase()
    );
    return rows.rows[0] ? map(rows.rows[0]) : null;
  }
  async create(input: CompanySaveInput) {
    const value = await normalize(input);
    const result =
      await sql`INSERT INTO companies (code,name,legal_name,primary_phone,primary_email,gstin,pan,website,description,logo_path,logo_dark_path,industry_id,industry_name,status,emails_json,phones_json,addresses_json,bank_accounts_json,social_links_json) VALUES (${value.code},${value.name},${value.legalName},${value.primaryPhone},${value.primaryEmail},${value.gstin},${value.pan},${value.website},${value.description},${value.logoPath},${value.logoDarkPath},${value.industryId},${value.industryName},${value.status},${JSON.stringify(value.emails)},${JSON.stringify(value.phones)},${JSON.stringify(value.addresses)},${JSON.stringify(value.bankAccounts)},${JSON.stringify(value.socialLinks)})`.execute(
        getCoreDatabase()
      );
    return (await this.find(Number(result.insertId)))!;
  }
  async update(id: string | number, input: CompanySaveInput) {
    const current = await this.find(id);
    if (!current || current.name === "-") return null;
    const value = await normalize(input, current);
    await sql`UPDATE companies SET code=${value.code},name=${value.name},legal_name=${value.legalName},primary_phone=${value.primaryPhone},primary_email=${value.primaryEmail},gstin=${value.gstin},pan=${value.pan},website=${value.website},description=${value.description},logo_path=${value.logoPath},logo_dark_path=${value.logoDarkPath},industry_id=${value.industryId},industry_name=${value.industryName},status=${value.status},emails_json=${JSON.stringify(value.emails)},phones_json=${JSON.stringify(value.phones)},addresses_json=${JSON.stringify(value.addresses)},bank_accounts_json=${JSON.stringify(value.bankAccounts)},social_links_json=${JSON.stringify(value.socialLinks)},updated_at=CURRENT_TIMESTAMP WHERE id=${Number(id)}`.execute(
      getCoreDatabase()
    );
    return this.find(id);
  }
  async setActive(id: string | number, active: boolean) {
    const current = await this.find(id);
    if (!current || current.name.trim() === "-") return null;
    await sql`UPDATE companies SET status=${active ? "active" : "inactive"},updated_at=CURRENT_TIMESTAMP WHERE id=${Number(id)}`.execute(
      getCoreDatabase()
    );
    return this.find(id);
  }
  async forceDelete(id: string | number) {
    const current = await this.find(id);
    if (!current || current.name.trim() === "-") return null;
    await sql`DELETE FROM companies WHERE id=${Number(id)}`.execute(getCoreDatabase());
    return current;
  }
  async listIndustries(): Promise<CompanyIndustry[]> {
    const rows = await sql<{
      code: string;
      id: number | string;
      name: string;
    }>`SELECT id,code,name FROM industries WHERE status='active' ORDER BY name`.execute(
      getCoreDatabase()
    );
    return rows.rows.map((row) => ({ code: row.code, id: Number(row.id), name: row.name }));
  }
}
async function normalize(input: CompanySaveInput, current?: CompanyRecord) {
  const name = text(input.name ?? current?.name);
  if (!name) throw new Error("Company name is required.");
  const industryId = num(input.industryId ?? current?.industryId);
  let industryName = nil(input.industryName ?? current?.industryName);
  if (industryId) {
    const rows = await sql<{
      name: string;
    }>`SELECT name FROM industries WHERE id=${industryId} AND status='active' LIMIT 1`.execute(
      getCoreDatabase()
    );
    if (!rows.rows[0]) throw new Error("Select an active industry.");
    industryName = rows.rows[0].name;
  }
  return {
    code:
      text(input.code ?? current?.code) ||
      name
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "-")
        .slice(0, 24),
    name,
    legalName: nil(input.legalName ?? current?.legalName),
    primaryPhone: nil(input.primaryPhone ?? current?.primaryPhone),
    primaryEmail: nil(input.primaryEmail ?? current?.primaryEmail),
    gstin: nil(input.gstin ?? current?.gstin),
    pan: nil(input.pan ?? current?.pan),
    website: nil(input.website ?? current?.website),
    description: nil(input.description ?? current?.description),
    logoPath: nil(input.logoPath ?? current?.logoPath),
    logoDarkPath: nil(input.logoDarkPath ?? current?.logoDarkPath),
    industryId,
    industryName,
    status: input.status ?? (input.isActive === false ? "inactive" : current?.status) ?? "active",
    emails: input.emails ?? current?.emails ?? [],
    phones: input.phones ?? current?.phones ?? [],
    addresses: input.addresses ?? current?.addresses ?? [],
    bankAccounts: input.bankAccounts ?? current?.bankAccounts ?? [],
    socialLinks: input.socialLinks ?? current?.socialLinks ?? []
  };
}
function map(row: Row): CompanyRecord {
  return {
    id: Number(row.id),
    code: String(row.code),
    name: String(row.name),
    legalName: nil(row.legal_name),
    primaryPhone: nil(row.primary_phone),
    primaryEmail: nil(row.primary_email),
    gstin: nil(row.gstin),
    pan: nil(row.pan),
    website: nil(row.website),
    description: nil(row.description),
    logoPath: nil(row.logo_path),
    logoDarkPath: nil(row.logo_dark_path),
    industryId: num(row.industry_id),
    industryName: nil(row.industry_name),
    status: String(row.status) as CompanyRecord["status"],
    isActive: row.status === "active",
    emails: arr(row.emails_json),
    phones: arr(row.phones_json),
    addresses: arr(row.addresses_json),
    bankAccounts: arr(row.bank_accounts_json),
    socialLinks: arr(row.social_links_json),
    createdAt: date(row.created_at),
    updatedAt: date(row.updated_at)
  };
}
function text(v: unknown) {
  return String(v ?? "").trim();
}
function nil(v: unknown) {
  return text(v) || null;
}
function num(v: unknown) {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function arr(v: unknown) {
  try {
    return (Array.isArray(v) ? v : JSON.parse(String(v ?? "[]"))) as CompanyRecord["emails"];
  } catch {
    return [];
  }
}
function date(v: unknown) {
  return v instanceof Date ? v.toISOString() : new Date(String(v)).toISOString();
}
