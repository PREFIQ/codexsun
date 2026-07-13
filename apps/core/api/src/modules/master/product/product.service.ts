import { AppError } from "@codexsun/framework/errors";
import { ProductRepository } from "./product.repository.js";
import type { ProductListFilters, ProductSaveInput } from "./product.types.js";
export class ProductService {
  constructor(private readonly repository = new ProductRepository()) {}
  list(filters: ProductListFilters = {}) {
    return this.repository.list(filters);
  }
  find(id: string) {
    return this.repository.find(id);
  }
  async create(input: ProductSaveInput) {
    await this.validateReferences(input);
    return this.repository.create(input);
  }
  async update(id: string, input: ProductSaveInput) {
    await this.validateReferences(input);
    return this.repository.update(id, input);
  }
  setActive(id: string, active: boolean) {
    return this.repository.setActive(id, active);
  }
  forceDelete(id: string) {
    return this.repository.forceDelete(id);
  }

  private async validateReferences(input: ProductSaveInput) {
    const validations = [
      [input.typeId, "product type", (id: number) => this.repository.hasActiveProductType(id)],
      [
        input.productCategoryId,
        "product category",
        (id: number) => this.repository.hasActiveProductCategory(id)
      ],
      [input.hsnCodeId, "HSN code", (id: number) => this.repository.hasActiveHsnCode(id)],
      [input.unitId, "unit", (id: number) => this.repository.hasActiveUnit(id)],
      [input.taxId, "GST tax", (id: number) => this.repository.hasActiveTax(id)]
    ] as const;
    for (const [id, label, exists] of validations) {
      if (id != null && !(await exists(Number(id)))) {
        throw AppError.validation(`Selected ${label} was not found or is inactive.`);
      }
    }
  }
}
