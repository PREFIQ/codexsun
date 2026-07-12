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
  create(input: ProductSaveInput) {
    return this.repository.create(input);
  }
  update(id: string, input: ProductSaveInput) {
    return this.repository.update(id, input);
  }
  setActive(id: string, active: boolean) {
    return this.repository.setActive(id, active);
  }
  forceDelete(id: string) {
    return this.repository.forceDelete(id);
  }
}
