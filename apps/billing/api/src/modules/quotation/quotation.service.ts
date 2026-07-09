import { QuotationRepository } from "./quotation.repository.js";
import type { QuotationLineItemInput, QuotationSavePayload } from "./quotation.types.js";
import { BillingSettingsRepository } from "../settings/settings.repository.js";
import { formatBillingDocumentNumber } from "../settings/settings.types.js";

export class QuotationService {
  constructor(
    private readonly repository = new QuotationRepository(),
    private readonly settings = new BillingSettingsRepository()
  ) {}

  async list(databaseName: string) {
    return this.repository.list(databaseName);
  }

  async get(databaseName: string, id: string) {
    return this.repository.get(databaseName, id);
  }

  async create(databaseName: string, input: QuotationSavePayload) {
    const billingSettings = await this.settings.getBillingSettings(databaseName);
    const numbering = billingSettings.numbering.quotation;
    const normalizedInput = numbering.automatic
      ? { ...input, quotationNumber: formatBillingDocumentNumber(numbering) }
      : input;
    const quotation = await this.repository.create(databaseName, normalizeInput(normalizedInput));
    if (numbering.automatic) {
      await this.settings.saveBillingSettings(databaseName, {
        ...billingSettings,
        numbering: {
          ...billingSettings.numbering,
          quotation: { ...numbering, nextNumber: numbering.nextNumber + 1 }
        }
      });
    }
    return quotation;
  }

  async update(databaseName: string, id: string, input: QuotationSavePayload) {
    return this.repository.update(databaseName, id, normalizeInput(input));
  }

  async confirm(databaseName: string, id: string) {
    return this.repository.setStatus(databaseName, id, "confirmed");
  }

  async cancel(databaseName: string, id: string) {
    return this.repository.setStatus(databaseName, id, "cancelled");
  }
}

function normalizeInput(input: QuotationSavePayload): QuotationSavePayload {
  const items = input.items.map(normalizeItem).filter((item) => item.productName.length > 0 && item.quantity > 0);
  if (!input.customerName.trim()) throw new Error("Customer name is required.");
  if (!input.quotationNumber.trim()) throw new Error("Quotation number is required.");
  if (!input.date.trim()) throw new Error("Quotation date is required.");
  if (!items.length) throw new Error("Add at least one quotation item.");
  return {
    billingAddress: input.billingAddress.trim(),
    customerName: input.customerName.trim(),
    date: input.date.trim(),
    items,
    notes: input.notes.trim(),
    quotationNumber: input.quotationNumber.trim().toUpperCase(),
    roundOff: Number(input.roundOff ?? 0) || 0,
    salesLedger: input.salesLedger.trim(),
    shippingAddress: input.shippingAddress.trim(),
    status: input.status,
    taxType: input.taxType,
    terms: input.terms.trim(),
    workOrderNo: input.workOrderNo.trim(),
  };
}

function normalizeItem(item: QuotationLineItemInput): QuotationLineItemInput {
  return {
    colour: item.colour.trim(),
    dcNo: item.dcNo.trim().toUpperCase(),
    description: item.description.trim(),
    hsnCode: item.hsnCode.trim().toUpperCase(),
    poNo: item.poNo.trim().toUpperCase(),
    productName: item.productName.trim(),
    quantity: roundMoney(Number(item.quantity) || 0),
    rate: roundMoney(Number(item.rate) || 0),
    size: item.size.trim(),
    taxRate: roundMoney(Number(item.taxRate) || 0),
    unit: item.unit.trim().toUpperCase() || "NOS",
  };
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}
