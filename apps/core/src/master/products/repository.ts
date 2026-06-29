import type { ProductItem } from "./contracts.js";

export interface ProductRepository {
  list(tenantId: string): Promise<ProductItem[]>;
  getById(tenantId: string, itemId: string): Promise<ProductItem | null>;
  getByCode(tenantId: string, code: string): Promise<ProductItem | null>;
  create(product: ProductItem): Promise<void>;
  update(product: ProductItem): Promise<void>;
  archive(tenantId: string, itemId: string): Promise<void>;
  restore(tenantId: string, itemId: string): Promise<void>;
}

export class InMemoryProductRepository implements ProductRepository {
  private products: ProductItem[] = [];

  async list(tenantId: string): Promise<ProductItem[]> {
    return this.products
      .filter((p) => p.tenantId === tenantId && !p.deletedAt)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async getById(tenantId: string, itemId: string): Promise<ProductItem | null> {
    return this.products.find((p) => p.itemId === itemId && p.tenantId === tenantId) ?? null;
  }

  async getByCode(tenantId: string, code: string): Promise<ProductItem | null> {
    return this.products.find((p) => p.tenantId === tenantId && p.code === code && !p.deletedAt) ?? null;
  }

  async create(product: ProductItem): Promise<void> {
    this.products.push(product);
  }

  async update(product: ProductItem): Promise<void> {
    const idx = this.products.findIndex((p) => p.itemId === product.itemId && p.tenantId === product.tenantId);
    if (idx !== -1) this.products[idx] = product;
  }

  async archive(tenantId: string, itemId: string): Promise<void> {
    const product = await this.getById(tenantId, itemId);
    if (product) {
      product.status = "archived";
      product.deletedAt = new Date().toISOString();
    }
  }

  async restore(tenantId: string, itemId: string): Promise<void> {
    const product = this.products.find((p) => p.itemId === itemId && p.tenantId === tenantId);
    if (product) {
      product.status = "active";
      delete (product as { deletedAt?: unknown }).deletedAt;
    }
  }
}
