import { SalesRepository } from "./sales.repository.js";
import type { SaleSavePayload } from "./sales.types.js";

export class SalesService {
  constructor(private readonly repository = new SalesRepository()) {}

  async listSales(databaseName: string) {
    return this.repository.list(databaseName);
  }

  async createSale(databaseName: string, input: SaleSavePayload) {
    return this.repository.create(databaseName, this.normalize(input));
  }

  async updateSale(databaseName: string, id: string, input: SaleSavePayload) {
    return this.repository.update(databaseName, id, this.normalize(input));
  }

  async confirmSale(databaseName: string, id: string) {
    return this.repository.setStatus(databaseName, id, "confirmed");
  }

  async cancelSale(databaseName: string, id: string) {
    return this.repository.setStatus(databaseName, id, "cancelled");
  }

  private normalize(input: SaleSavePayload): SaleSavePayload {
    return {
      amount: Number(input.amount) || 0,
      currencyCode: input.currencyCode.trim().toUpperCase(),
      customerName: input.customerName.trim(),
      invoiceNumber: input.invoiceNumber.trim().toUpperCase(),
      issuedOn: input.issuedOn.trim(),
      status: input.status
    };
  }
}
