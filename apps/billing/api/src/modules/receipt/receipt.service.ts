import { AppError } from "@codexsun/framework/errors";
import { formatBillingDocumentNumber, nextBillingDocumentNumber } from "../settings/index.js";
import { BillingSettingsRepository } from "../settings/settings.repository.js";
import { ReceiptRepository } from "./receipt.repository.js";
import type { ReceiptSavePayload } from "./receipt.types.js";

export class ReceiptService {
  constructor(
    private readonly repository = new ReceiptRepository(),
    private readonly settings = new BillingSettingsRepository()
  ) {}
  list(databaseName: string) {
    return this.repository.list(databaseName);
  }
  get(databaseName: string, id: string) {
    return this.repository.get(databaseName, id);
  }
  async context(databaseName: string) {
    const context = await this.repository.context(databaseName);
    if (!context)
      throw AppError.conflict(
        "Default Company, Financial Year, and INR currency context must be configured before creating receipts."
      );
    const settings = await this.settings.getBillingSettings(databaseName);
    return {
      ...context,
      suggestedReceiptNumber: formatBillingDocumentNumber(settings.numbering.receipt)
    };
  }
  allocationCandidates(databaseName: string, customerId: number) {
    return this.repository.allocationCandidates(databaseName, customerId);
  }
  async create(databaseName: string, payload: ReceiptSavePayload) {
    const input = await this.prepare(databaseName, payload);
    const duplicate = await this.repository.findByNumber(
      databaseName,
      input.companyId,
      input.financialYearId,
      input.receiptNumber
    );
    if (duplicate)
      throw AppError.conflict("Receipt number already exists for this company and financial year.");
    const record = await this.repository.create(databaseName, input);
    const settings = await this.settings.getBillingSettings(databaseName);
    const sequence = settings.numbering.receipt;
    const nextNumber = nextBillingDocumentNumber(sequence, input.receiptNumber);
    if (sequence.automatic && nextNumber > sequence.nextNumber) {
      await this.settings.saveBillingSettings(databaseName, {
        ...settings,
        numbering: { ...settings.numbering, receipt: { ...sequence, nextNumber } }
      });
    }
    return record!;
  }
  async update(databaseName: string, id: string, payload: ReceiptSavePayload) {
    const current = await this.repository.get(databaseName, id);
    if (!current) return null;
    this.assertDraft(current.status);
    const input = await this.prepare(databaseName, payload, id);
    if (
      await this.repository.findByNumber(
        databaseName,
        input.companyId,
        input.financialYearId,
        input.receiptNumber,
        id
      )
    )
      throw AppError.conflict("Receipt number already exists for this company and financial year.");
    return this.repository.update(databaseName, id, input);
  }
  async post(databaseName: string, id: string) {
    const current = await this.repository.get(databaseName, id);
    if (!current) return null;
    this.assertDraft(current.status);
    if (current.totalAmount <= 0)
      throw AppError.conflict("Enter a positive receipt total before posting.");
    if (current.unallocatedAmount < 0)
      throw AppError.conflict("Receipt allocations exceed the receipt total.");
    return this.repository.setStatus(databaseName, id, "posted");
  }
  async cancel(databaseName: string, id: string) {
    const current = await this.repository.get(databaseName, id);
    if (!current) return null;
    if (current.status !== "posted")
      throw AppError.conflict("Only posted receipts can be cancelled.");
    return this.repository.setStatus(databaseName, id, "cancelled");
  }
  async deleteDraft(databaseName: string, id: string) {
    const current = await this.repository.get(databaseName, id);
    if (!current) return null;
    this.assertDraft(current.status);
    return this.repository.deleteDraft(databaseName, id);
  }
  private async prepare(databaseName: string, payload: ReceiptSavePayload, excludeId?: string) {
    const settings = await this.settings.getBillingSettings(databaseName);
    const receiptNumber =
      payload.receiptNumber.trim() || formatBillingDocumentNumber(settings.numbering.receipt);
    const allocations = payload.allocations.map((item) => ({
      saleId: item.saleId.trim(),
      allocatedAmount: money(item.allocatedAmount)
    }));
    if (new Set(allocations.map((item) => item.saleId)).size !== allocations.length)
      throw AppError.validation("A sales invoice can only be allocated once in a receipt.");
    const totalAmount = money(
      payload.amount + payload.tdsAmount - payload.discountAmount + payload.roundOff
    );
    const allocatedAmount = money(allocations.reduce((sum, item) => sum + item.allocatedAmount, 0));
    if (totalAmount < 0) throw AppError.validation("Receipt total cannot be negative.");
    if (allocations.some((item) => !item.saleId || item.allocatedAmount <= 0))
      throw AppError.validation(
        "Every receipt allocation requires a sales invoice and a positive amount."
      );
    if (allocatedAmount > totalAmount)
      throw AppError.validation("Allocated amount cannot exceed the receipt total.");
    const input = {
      ...payload,
      allocations,
      receiptNumber,
      notes: payload.notes.trim(),
      referenceNo: payload.referenceNo.trim(),
      ledgerId: payload.ledgerId || (await this.repository.defaultLedgerId(databaseName)),
      totalAmount,
      allocatedAmount,
      unallocatedAmount: money(totalAmount - allocatedAmount)
    };
    const refs = await this.repository.validateReferences(databaseName, input, excludeId);
    if (!refs.company) throw AppError.validation("Selected company is invalid or inactive.");
    if (!refs.financialYear)
      throw AppError.validation("Receipt date is outside the selected active financial year.");
    if (!refs.currency) throw AppError.validation("Selected currency is invalid or inactive.");
    if (!refs.customer) throw AppError.validation("Selected customer is invalid or inactive.");
    if (!refs.ledger)
      throw AppError.validation("Selected cash or bank ledger is invalid or inactive.");
    if (!refs.allocations)
      throw AppError.validation(
        "One or more sales allocations are invalid, belong to another customer, or exceed the outstanding balance."
      );
    return input;
  }
  private assertDraft(status: string) {
    if (status !== "draft")
      throw AppError.conflict("Only draft receipts can be edited or deleted.");
  }
}
function money(value: number) {
  return Math.round(Number(value) * 100) / 100;
}
