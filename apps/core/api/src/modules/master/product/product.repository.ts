import { randomBytes } from "node:crypto";
import { sql } from "kysely";
import { getCoreDatabase } from "../../../database/core-database.js";
import type {
  ProductListFilters,
  ProductRecord,
  ProductSaveInput,
  ProductStatus
} from "./product.types.js";

type ProductRow = {
  id: number | string;
  uuid: string;
  name: string;
  product_type_id: number | string | null;
  product_category_id: number | string | null;
  hsn_code_id: number | string | null;
  unit_id: number | string | null;
  gst_tax_id: number | string | null;
  opening_qty: number | string;
  opening_price: number | string;
  status: string;
  created_at: Date | string;
  updated_at: Date | string;
  deleted_at: Date | string | null;
};

export class ProductRepository {
  async hasActiveProductType(id: number) {
    const result = await sql<{ id: number }>`SELECT id FROM product_types
      WHERE id=${id} AND status='active' LIMIT 1`.execute(getCoreDatabase());
    return Boolean(result.rows[0]);
  }

  async hasActiveProductCategory(id: number) {
    const result = await sql<{ id: number }>`SELECT id FROM product_categories
      WHERE id=${id} AND status='active' LIMIT 1`.execute(getCoreDatabase());
    return Boolean(result.rows[0]);
  }

  async hasActiveHsnCode(id: number) {
    const result = await sql<{ id: number }>`SELECT id FROM hsn_codes
      WHERE id=${id} AND status='active' LIMIT 1`.execute(getCoreDatabase());
    return Boolean(result.rows[0]);
  }

  async hasActiveUnit(id: number) {
    const result = await sql<{ id: number }>`SELECT id FROM units
      WHERE id=${id} AND status='active' LIMIT 1`.execute(getCoreDatabase());
    return Boolean(result.rows[0]);
  }

  async hasActiveTax(id: number) {
    const result = await sql<{ id: number }>`SELECT id FROM taxes
      WHERE id=${id} AND status='active' LIMIT 1`.execute(getCoreDatabase());
    return Boolean(result.rows[0]);
  }

  async list(filters: ProductListFilters = {}) {
    const search = filters.search?.trim().toLowerCase() ?? "";
    const result = await sql<ProductRow>`SELECT * FROM products
      WHERE deleted_at IS NULL AND (${search} = '' OR LOWER(name) LIKE ${`%${search}%`})
      ORDER BY name, id`.execute(getCoreDatabase());
    return result.rows.map(toProduct);
  }

  async find(id: string | number) {
    const result = await sql<ProductRow>`SELECT * FROM products
      WHERE id=${Number(id)} AND deleted_at IS NULL LIMIT 1`.execute(getCoreDatabase());
    return result.rows[0] ? toProduct(result.rows[0]) : null;
  }

  async create(input: ProductSaveInput) {
    const value = normalize(input);
    const result = await sql`INSERT INTO products
      (uuid, name, product_type_id, product_category_id, hsn_code_id, unit_id, gst_tax_id,
       opening_qty, opening_price, status)
      VALUES (${randomBytes(4).toString("hex")}, ${value.name}, ${value.typeId},
       ${value.productCategoryId}, ${value.hsnCodeId}, ${value.unitId}, ${value.taxId},
       ${value.openingStock}, ${value.openingRate}, ${value.status})`.execute(getCoreDatabase());
    return (await this.find(Number(result.insertId)))!;
  }

  async update(id: string | number, input: ProductSaveInput) {
    const current = await this.find(id);
    if (!current || current.name === "-") return null;
    const value = normalize(input, current);
    await sql`UPDATE products SET name=${value.name}, product_type_id=${value.typeId},
      product_category_id=${value.productCategoryId}, hsn_code_id=${value.hsnCodeId},
      unit_id=${value.unitId}, gst_tax_id=${value.taxId}, opening_qty=${value.openingStock},
      opening_price=${value.openingRate}, status=${value.status}, updated_at=CURRENT_TIMESTAMP
      WHERE id=${Number(id)} AND deleted_at IS NULL`.execute(getCoreDatabase());
    return this.find(id);
  }

  async setActive(id: string | number, active: boolean) {
    const current = await this.find(id);
    if (!current || current.name === "-") return null;
    await sql`UPDATE products SET status=${active ? "active" : "suspend"},
      updated_at=CURRENT_TIMESTAMP WHERE id=${Number(id)} AND deleted_at IS NULL`.execute(
      getCoreDatabase()
    );
    return this.find(id);
  }

  async forceDelete(id: string | number) {
    const current = await this.find(id);
    if (!current || current.name === "-") return null;
    await sql`UPDATE products SET status='deleted', deleted_at=CURRENT_TIMESTAMP,
      updated_at=CURRENT_TIMESTAMP WHERE id=${Number(id)} AND deleted_at IS NULL`.execute(
      getCoreDatabase()
    );
    return current;
  }
}

function normalize(input: ProductSaveInput, current?: ProductRecord) {
  const name = String(input.name ?? current?.name ?? "").trim();
  if (!name) throw new Error("Product name is required.");
  return {
    name,
    typeId: nullableNumber(input.typeId ?? current?.typeId),
    productCategoryId: nullableNumber(input.productCategoryId ?? current?.productCategoryId),
    hsnCodeId: nullableNumber(input.hsnCodeId ?? current?.hsnCodeId),
    unitId: nullableNumber(input.unitId ?? current?.unitId),
    taxId: nullableNumber(input.taxId ?? current?.taxId),
    openingStock: numberValue(input.openingStock ?? current?.openingStock),
    openingRate: numberValue(input.openingRate ?? current?.openingRate),
    status: (input.status ??
      (input.isActive === false ? "inactive" : current?.status) ??
      "active") as ProductStatus
  };
}

function toProduct(row: ProductRow): ProductRecord {
  return {
    id: Number(row.id),
    uuid: row.uuid,
    name: row.name,
    typeId: nullableNumber(row.product_type_id),
    productCategoryId: nullableNumber(row.product_category_id),
    hsnCodeId: nullableNumber(row.hsn_code_id),
    unitId: nullableNumber(row.unit_id),
    taxId: nullableNumber(row.gst_tax_id),
    openingStock: numberValue(row.opening_qty),
    openingRate: numberValue(row.opening_price),
    status: row.status as ProductStatus,
    isActive: row.status === "active",
    createdAt: dateValue(row.created_at),
    updatedAt: dateValue(row.updated_at),
    deletedAt: row.deleted_at ? dateValue(row.deleted_at) : null
  };
}
function nullableNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
function numberValue(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}
function dateValue(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
