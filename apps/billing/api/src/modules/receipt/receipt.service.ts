import { AppError } from "@codexsun/framework/errors";
import { BillingSettingsRepository } from "../settings/settings.repository.js";
import { formatBillingDocumentNumber, nextBillingDocumentNumber } from "../settings/settings.types.js";
import { ReceiptRepository } from "./receipt.repository.js";
import type { ReceiptInput, ReceiptStatus } from "./receipt.types.js";
export class ReceiptService {
 constructor(private readonly repository = new ReceiptRepository(), private readonly settings = new BillingSettingsRepository()) {}
 list(databaseName: string) { return this.repository.list(databaseName); }
 get(databaseName: string, id: string) { return this.repository.get(databaseName, id); }
 async create(databaseName: string, input: ReceiptInput) { const settings = await this.settings.getBillingSettings(databaseName); const sequence = settings.numbering.receipt; const generated = formatBillingDocumentNumber(sequence); const number = String(input.receiptNumber ?? "").trim() || generated; if (await this.repository.findByNumber(databaseName, number)) throw AppError.conflict("Receipt number already exists."); const record = await this.repository.create(databaseName, { ...input, receiptNumber: number, status: "draft" }); const nextNumber = nextBillingDocumentNumber(sequence, number); if (sequence.automatic && nextNumber > sequence.nextNumber) await this.settings.saveBillingSettings(databaseName, { ...settings, numbering: { ...settings.numbering, receipt: { ...sequence, nextNumber } } }); return record; }
 async update(databaseName: string, id: string, input: ReceiptInput) { const current = await this.repository.get(databaseName, id); if (!current) return null; this.assertDraft(current.status); return this.repository.update(databaseName, id, input); }
 async setStatus(databaseName: string, id: string, status: ReceiptStatus) { const current = await this.repository.get(databaseName, id); if (!current) return null; if (status === "posted" && current.status !== "draft") throw AppError.conflict("Only draft receipts can be posted."); return this.repository.setStatus(databaseName, id, status); }
 async deleteDraft(databaseName: string, id: string) { const current = await this.repository.get(databaseName, id); if (!current) return null; this.assertDraft(current.status); return this.repository.delete(databaseName, id); }
 private assertDraft(status: ReceiptStatus) { if (status !== "draft") throw AppError.conflict("Only draft receipts can be edited."); }
}
