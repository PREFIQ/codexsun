import { randomUUID } from "node:crypto";
import { sql } from "kysely";
import { getCoreDatabase } from "../../database/core-database.js";
import type { MasterChild, MasterRecord, MasterSaveInput } from "./foundation/master.types.js";
import type { MasterDefinition } from "./foundation/master.types.js";
type Row = Record<string, unknown>;
export class MasterRepository {
  constructor(private readonly definition: MasterDefinition) {}
  async list(tenantId: string, search = "") { const db = getCoreDatabase(); let query = db.selectFrom(this.definition.tableName as never).selectAll().where("tenant_id" as never, "in", ["global", tenantId] as never).orderBy("code" as never); if (search.trim()) { const like = "%" + search.trim() + "%"; query = query.where((eb) => eb.or([eb("name" as never, "like", like as never), eb("code" as never, "like", like as never), eb("primary_phone" as never, "like", like as never), eb("primary_email" as never, "like", like as never)])); } const rows = await query.execute() as Row[]; return rows.map(toRecord); }
  async find(tenantId: string, id: string) { const row = await getCoreDatabase().selectFrom(this.definition.tableName as never).selectAll().where("tenant_id" as never, "in", ["global", tenantId] as never).where("id" as never, "=", id as never).executeTakeFirst() as Row | undefined; return row ? toRecord(row) : null; }
  async create(tenantId: string, input: MasterSaveInput) { const record = normalizeRecord(tenantId, input, null); await getCoreDatabase().insertInto(this.definition.tableName as never).values(toRow(record) as never).execute(); await syncChildTables(this.definition.tableName, record); return record; }
  async update(tenantId: string, id: string, input: MasterSaveInput) { const current = await this.find(tenantId, id); if (!current || current.tenantId !== tenantId || isReserved(current)) return null; const record = normalizeRecord(tenantId, input, current); await getCoreDatabase().updateTable(this.definition.tableName as never).set(toRow(record) as never).where("tenant_id" as never, "=", tenantId as never).where("id" as never, "=", id as never).execute(); await syncChildTables(this.definition.tableName, record); return record; }
  async setActive(tenantId: string, id: string, isActive: boolean) { const current = await this.find(tenantId, id); if (!current || current.tenantId !== tenantId || isReserved(current)) return null; await getCoreDatabase().updateTable(this.definition.tableName as never).set({ is_active: isActive ? 1 : 0, status: isActive ? "active" : "suspend" } as never).where("tenant_id" as never, "=", tenantId as never).where("id" as never, "=", id as never).execute(); return this.find(tenantId, id); }
  async forceDelete(tenantId: string, id: string) { const current = await this.find(tenantId, id); if (!current || current.tenantId !== tenantId || isReserved(current)) return null; await getCoreDatabase().deleteFrom(this.definition.tableName as never).where("tenant_id" as never, "=", tenantId as never).where("id" as never, "=", id as never).execute(); return current; }
}
function isReserved(record: MasterRecord) { return record.tenantId === "global" || record.name.trim() === "-"; }
function normalizeRecord(tenantId: string, input: MasterSaveInput, current: MasterRecord | null): MasterRecord { const now = new Date().toISOString(); const name = stringValue(input.name ?? current?.name); if (!name) throw new Error("Name is required."); const code = stringValue(input.code ?? current?.code) || nextCode(name); const emails = normalizeChildren(input.emails ?? current?.emails); const phones = normalizeChildren(input.phones ?? current?.phones); return { id: current?.id ?? code.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + randomUUID().slice(0, 8), uuid: current?.uuid ?? randomUUID().slice(0, 8), tenantId, code, name, legalName: nullable(input.legalName ?? current?.legalName), typeId: nullable(input.typeId ?? current?.typeId), typeName: nullable(input.typeName ?? current?.typeName), groupId: nullable(input.groupId ?? current?.groupId), groupName: nullable(input.groupName ?? current?.groupName), primaryPhone: nullable(input.primaryPhone ?? (input.phones ? primaryChildValue(phones, "phone") : current?.primaryPhone) ?? primaryChildValue(phones, "phone")), primaryEmail: nullable(input.primaryEmail ?? (input.emails ? primaryChildValue(emails, "email") : current?.primaryEmail) ?? primaryChildValue(emails, "email")), gstin: nullable(input.gstin ?? current?.gstin), pan: nullable(input.pan ?? current?.pan), msmeNo: nullable(input.msmeNo ?? current?.msmeNo), msmeCategory: nullable(input.msmeCategory ?? current?.msmeCategory), tanNo: nullable(input.tanNo ?? current?.tanNo), tdsAvailable: booleanValue(input.tdsAvailable ?? current?.tdsAvailable), tcsAvailable: booleanValue(input.tcsAvailable ?? current?.tcsAvailable), openingBalance: numberValue(input.openingBalance ?? current?.openingBalance), creditLimit: numberValue(input.creditLimit ?? current?.creditLimit), website: nullable(input.website ?? current?.website), description: nullable(input.description ?? current?.description), logoPath: nullable(input.logoPath ?? current?.logoPath), logoDarkPath: nullable(input.logoDarkPath ?? current?.logoDarkPath), productCategoryId: nullable(input.productCategoryId ?? current?.productCategoryId), productCategoryName: nullable(input.productCategoryName ?? current?.productCategoryName), unitId: nullable(input.unitId ?? current?.unitId), unitName: nullable(input.unitName ?? current?.unitName), hsnCodeId: nullable(input.hsnCodeId ?? current?.hsnCodeId), hsnCode: nullable(input.hsnCode ?? current?.hsnCode), taxId: nullable(input.taxId ?? current?.taxId), taxName: nullable(input.taxName ?? current?.taxName), openingStock: numberValue(input.openingStock ?? current?.openingStock), openingRate: numberValue(input.openingRate ?? current?.openingRate), status: input.status ?? current?.status ?? "active", isActive: booleanValue(input.isActive ?? current?.isActive ?? true), emails, phones, addresses: normalizeChildren(input.addresses ?? current?.addresses), bankAccounts: normalizeChildren(input.bankAccounts ?? current?.bankAccounts), socialLinks: normalizeChildren(input.socialLinks ?? current?.socialLinks), createdAt: current?.createdAt ?? now, updatedAt: now }; }
function toRow(record: MasterRecord) { return { id: record.id, uuid: record.uuid, tenant_id: record.tenantId, code: record.code, name: record.name, legal_name: record.legalName, type_id: record.typeId, type_name: record.typeName, group_id: record.groupId, group_name: record.groupName, primary_phone: record.primaryPhone, primary_email: record.primaryEmail, gstin: record.gstin, pan: record.pan, msme_no: record.msmeNo, msme_category: record.msmeCategory, tan_no: record.tanNo, tds_available: record.tdsAvailable ? 1 : 0, tcs_available: record.tcsAvailable ? 1 : 0, opening_balance: record.openingBalance, credit_limit: record.creditLimit, website: record.website, description: record.description, logo_path: record.logoPath, logo_dark_path: record.logoDarkPath, product_category_id: record.productCategoryId, product_category_name: record.productCategoryName, unit_id: record.unitId, unit_name: record.unitName, hsn_code_id: record.hsnCodeId, hsn_code: record.hsnCode, tax_id: record.taxId, tax_name: record.taxName, opening_stock: record.openingStock, opening_rate: record.openingRate, status: record.status, is_active: record.isActive ? 1 : 0, emails_json: sql.lit(JSON.stringify(record.emails)), phones_json: sql.lit(JSON.stringify(record.phones)), addresses_json: sql.lit(JSON.stringify(record.addresses)), bank_accounts_json: sql.lit(JSON.stringify(record.bankAccounts)), social_links_json: sql.lit(JSON.stringify(record.socialLinks)), created_at: new Date(record.createdAt), updated_at: new Date(record.updatedAt) }; }
function toRecord(row: Row): MasterRecord { return { id: String(row.id), uuid: String(row.uuid), tenantId: String(row.tenant_id), code: String(row.code), name: String(row.name), legalName: nullable(row.legal_name), typeId: nullable(row.type_id), typeName: nullable(row.type_name), groupId: nullable(row.group_id), groupName: nullable(row.group_name), primaryPhone: nullable(row.primary_phone), primaryEmail: nullable(row.primary_email), gstin: nullable(row.gstin), pan: nullable(row.pan), msmeNo: nullable(row.msme_no), msmeCategory: nullable(row.msme_category), tanNo: nullable(row.tan_no), tdsAvailable: booleanValue(row.tds_available), tcsAvailable: booleanValue(row.tcs_available), openingBalance: numberValue(row.opening_balance), creditLimit: numberValue(row.credit_limit), website: nullable(row.website), description: nullable(row.description), logoPath: nullable(row.logo_path), logoDarkPath: nullable(row.logo_dark_path), productCategoryId: nullable(row.product_category_id), productCategoryName: nullable(row.product_category_name), unitId: nullable(row.unit_id), unitName: nullable(row.unit_name), hsnCodeId: nullable(row.hsn_code_id), hsnCode: nullable(row.hsn_code), taxId: nullable(row.tax_id), taxName: nullable(row.tax_name), openingStock: numberValue(row.opening_stock), openingRate: numberValue(row.opening_rate), status: String(row.status ?? "active") as MasterRecord["status"], isActive: booleanValue(row.is_active), emails: parseArray(row.emails_json), phones: parseArray(row.phones_json), addresses: parseArray(row.addresses_json), bankAccounts: parseArray(row.bank_accounts_json), socialLinks: parseArray(row.social_links_json), createdAt: dateValue(row.created_at), updatedAt: dateValue(row.updated_at) }; }
function parseArray(value: unknown): MasterChild[] { if (Array.isArray(value)) return normalizeChildren(value); if (!value) return []; try { return normalizeChildren(JSON.parse(String(value))); } catch { return []; } }
function normalizeChildren(value: unknown): MasterChild[] { return Array.isArray(value) ? value.map((item) => ({ ...(item && typeof item === "object" ? item as Record<string, boolean | number | string | null> : {}), id: stringValue((item as { id?: unknown })?.id) || randomUUID().slice(0, 8) })) : []; }
function stringValue(value: unknown) { return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim(); }
function nullable(value: unknown) { const string = stringValue(value); return string ? string : null; }
function numberValue(value: unknown) { const number = Number(value ?? 0); return Number.isFinite(number) ? number : 0; }
function booleanValue(value: unknown) { return value === true || value === 1 || value === "1" || value === "true"; }
function dateValue(value: unknown) { return value instanceof Date ? value.toISOString() : String(value ?? new Date().toISOString()); }
function nextCode(name: string) { return name.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24) || "M-" + randomUUID().slice(0, 6); }
function primaryChildValue(items: MasterChild[], key: string) { return items.find((item) => booleanValue(item.isPrimary))?.[key] ?? items[0]?.[key] ?? null; }

async function syncChildTables(tableName: string, record: MasterRecord) {
  await syncChildTable(tableName + "_emails", record.id, record.emails, (item, index) => ({
    email: nullable(item.email),
    email_type: nullable(item.emailType),
    id: childId(record.id, item, "email", index),
    is_primary: booleanValue(item.isPrimary) ? 1 : 0,
    parent_id: record.id,
    sort_order: index + 1
  }));
  await syncChildTable(tableName + "_phones", record.id, record.phones, (item, index) => ({
    id: childId(record.id, item, "phone", index),
    is_primary: booleanValue(item.isPrimary) ? 1 : 0,
    parent_id: record.id,
    phone: nullable(item.phone),
    phone_type: nullable(item.phoneType),
    sort_order: index + 1
  }));
  await syncChildTable(tableName + "_addresses", record.id, record.addresses, (item, index) => ({
    address_line1: nullable(item.addressLine1),
    address_line2: nullable(item.addressLine2),
    address_type_id: nullable(item.addressTypeId),
    address_type_name: nullable(item.addressTypeName ?? item.addressType),
    city_id: nullable(item.cityId),
    city_name: nullable(item.cityName ?? item.city),
    country_id: nullable(item.countryId),
    country_name: nullable(item.countryName ?? item.country),
    district_id: nullable(item.districtId),
    district_name: nullable(item.districtName ?? item.district),
    id: childId(record.id, item, "address", index),
    is_default: booleanValue(item.isDefault) ? 1 : 0,
    parent_id: record.id,
    pincode_id: nullable(item.pincodeId),
    pincode_name: nullable(item.pincodeName ?? item.pincode),
    sort_order: index + 1,
    state_id: nullable(item.stateId),
    state_name: nullable(item.stateName ?? item.state)
  }));
  await syncChildTable(tableName + "_bank_accounts", record.id, record.bankAccounts, (item, index) => ({
    account_number: nullable(item.accountNumber),
    account_type: nullable(item.accountType),
    bank_name: nullable(item.bankName),
    bank_name_id: nullable(item.bankNameId),
    branch: nullable(item.branch),
    holder_name: nullable(item.holderName),
    id: childId(record.id, item, "bank", index),
    ifsc: nullable(item.ifsc),
    is_primary: booleanValue(item.isPrimary) ? 1 : 0,
    parent_id: record.id,
    sort_order: index + 1
  }));
  await syncChildTable(tableName + "_social_links", record.id, record.socialLinks, (item, index) => ({
    id: childId(record.id, item, "social", index),
    is_active: booleanValue(item.isActive ?? true) ? 1 : 0,
    parent_id: record.id,
    platform: nullable(item.platform),
    sort_order: index + 1,
    url: nullable(item.url)
  }));
}

async function syncChildTable(tableName: string, parentId: string, items: MasterChild[], mapItem: (item: MasterChild, index: number) => Record<string, boolean | number | string | null>) {
  const db = getCoreDatabase();
  await db.deleteFrom(tableName as never).where("parent_id" as never, "=", parentId as never).execute();
  const rows = items.map(mapItem);
  if (rows.length) await db.insertInto(tableName as never).values(rows as never).execute();
}

function childId(parentId: string, item: MasterChild, prefix: string, index: number) {
  const rawId = stringValue(item.id) || `${prefix}-${index + 1}-${randomUUID().slice(0, 8)}`;
  return `${parentId}-${rawId}`.slice(0, 120);
}
