import { AppError } from "@codexsun/framework/errors";
import { BillingSettingsRepository } from "../settings/settings.repository.js";
import {
  formatBillingDocumentNumber,
  nextBillingDocumentNumber
} from "../settings/settings.types.js";
import { PaymentRepository } from "./payment.repository.js";
import type { PaymentInput, PaymentStatus } from "./payment.types.js";

export class PaymentService {
  constructor(
    private readonly repository = new PaymentRepository(),
    private readonly settings = new BillingSettingsRepository()
  ) {}
  list(databaseName: string) {
    return this.repository.list(databaseName);
  }
  get(databaseName: string, id: string) {
    return this.repository.get(databaseName, id);
  }
  async create(databaseName: string, input: PaymentInput) {
    const settings = await this.settings.getBillingSettings(databaseName);
    const sequence = settings.numbering.payment;
    const generated = formatBillingDocumentNumber(sequence);
    const number = String(input.paymentNumber ?? "").trim() || generated;
    if (await this.repository.findByNumber(databaseName, number))
      throw AppError.conflict("Payment number already exists.");
    const record = await this.repository.create(databaseName, {
      ...input,
      paymentNumber: number,
      status: "draft"
    });
    const nextNumber = nextBillingDocumentNumber(sequence, number);
    if (sequence.automatic && nextNumber > sequence.nextNumber)
      await this.settings.saveBillingSettings(databaseName, {
        ...settings,
        numbering: { ...settings.numbering, payment: { ...sequence, nextNumber } }
      });
    return record;
  }
  async update(databaseName: string, id: string, input: PaymentInput) {
    const current = await this.repository.get(databaseName, id);
    if (!current) return null;
    this.assertDraft(current.status);
    return this.repository.update(databaseName, id, input);
  }
  async setStatus(databaseName: string, id: string, status: PaymentStatus) {
    const current = await this.repository.get(databaseName, id);
    if (!current) return null;
    if (status === "posted" && current.status !== "draft")
      throw AppError.conflict("Only draft payments can be posted.");
    if (status === "cancelled" && current.status === "cancelled")
      throw AppError.conflict("Payment is already cancelled.");
    return this.repository.setStatus(databaseName, id, status);
  }
  async deleteDraft(databaseName: string, id: string) {
    const current = await this.repository.get(databaseName, id);
    if (!current) return null;
    this.assertDraft(current.status);
    return this.repository.delete(databaseName, id);
  }
  private assertDraft(status: PaymentStatus) {
    if (status !== "draft") throw AppError.conflict("Only draft payments can be edited.");
  }
}
