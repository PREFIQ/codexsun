import { AppError } from "@codexsun/framework/errors";
import { InMemoryEventPublisher, type EventPublisher } from "@codexsun/framework/events";
import { InMemoryQueueAdapter, type QueueAdapter } from "@codexsun/framework/queue";
import { SalesService } from "../sales/sales.service.js";
import { createQuotationEvent } from "./quotation.events.js";
import { QuotationRepository } from "./quotation.repository.js";
import type { QuotationLineItemInput, QuotationSavePayload } from "./quotation.types.js";
import { BillingSettingsRepository } from "../settings/settings.repository.js";
import { formatBillingDocumentNumber } from "../settings/settings.types.js";

export class QuotationService {
  constructor(
    private readonly repository = new QuotationRepository(),
    private readonly settings = new BillingSettingsRepository(),
    private readonly sales = new SalesService(),
    private readonly events: EventPublisher = new InMemoryEventPublisher(),
    private readonly queue: QueueAdapter = new InMemoryQueueAdapter(),
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
    const payload = normalizeInput(normalizedInput);
    const existing = await this.repository.findByNumber(databaseName, payload.quotationNumber);
    if (existing) throw AppError.conflict("Quotation number already exists. Enter a unique quotation number.");
    const quotation = await this.repository.create(databaseName, payload);
    if (numbering.automatic) {
      await this.settings.saveBillingSettings(databaseName, {
        ...billingSettings,
        numbering: {
          ...billingSettings.numbering,
          quotation: { ...numbering, nextNumber: numbering.nextNumber + 1 }
        }
      });
    }
    await this.publish("created", quotation, databaseName);
    return quotation;
  }

  async update(databaseName: string, id: string, input: QuotationSavePayload) {
    const current = await this.repository.get(databaseName, id);
    if (!current) return null;
    this.assertDraft(current.status, "update");
    const payload = normalizeInput(input);
    const duplicate = await this.repository.findByNumber(databaseName, payload.quotationNumber);
    if (duplicate && duplicate.id !== id) throw AppError.conflict("Quotation number already exists. Enter a unique quotation number.");
    const quotation = await this.repository.update(databaseName, id, payload);
    if (quotation) await this.publish("updated", quotation, databaseName);
    return quotation;
  }

  async confirm(databaseName: string, id: string) {
    const current = await this.repository.get(databaseName, id);
    if (!current) return null;
    this.assertDraft(current.status, "confirm");
    const quotation = await this.repository.setStatus(databaseName, id, "confirmed");
    if (quotation) await this.publish("confirmed", quotation, databaseName);
    return quotation;
  }

  async cancel(databaseName: string, id: string) {
    const current = await this.repository.get(databaseName, id);
    if (!current) return null;
    if (current.status === "cancelled") throw AppError.conflict("Quotation is already cancelled.");
    if (current.generatedSalesInvoiceNo) throw AppError.conflict("A converted quotation cannot be cancelled.");
    const quotation = await this.repository.setStatus(databaseName, id, "cancelled");
    if (quotation) await this.publish("cancelled", quotation, databaseName);
    return quotation;
  }

  async convertToSale(databaseName: string, id: string) {
    const quotation = await this.repository.get(databaseName, id);
    if (!quotation) return null;
    if (quotation.status === "cancelled") throw AppError.conflict("A cancelled quotation cannot be converted.");
    if (quotation.generatedSalesInvoiceNo) throw AppError.conflict(`Quotation is already converted to ${quotation.generatedSalesInvoiceNo}.`);

    const billingSettings = await this.settings.getBillingSettings(databaseName);
    const salesNumbering = billingSettings.numbering.sales;
    const sale = await this.sales.createSale(databaseName, {
      billingAddress: quotation.billingAddress,
      currencyCode: "INR",
      customerEmail: "",
      customerName: quotation.customerName,
      customerPhone: "",
      invoiceNumber: formatBillingDocumentNumber(salesNumbering),
      issuedOn: new Date().toISOString().slice(0, 10),
      items: quotation.items.map((item) => ({
        colour: item.colour,
        dcNo: item.dcNo,
        description: [item.productName, item.description].filter(Boolean).join(" - "),
        hsnCode: item.hsnCode,
        poNo: item.poNo,
        quantity: item.quantity,
        rate: item.rate,
        size: item.size,
        taxRate: item.taxRate,
        unit: item.unit,
      })),
      notes: quotation.notes,
      roundOff: quotation.roundOff,
      shippingAddress: quotation.shippingAddress,
      status: "draft",
    });
    if (!salesNumbering.automatic) {
      await this.settings.saveBillingSettings(databaseName, {
        ...billingSettings,
        numbering: {
          ...billingSettings.numbering,
          sales: { ...salesNumbering, nextNumber: salesNumbering.nextNumber + 1 },
        },
      });
    }
    const converted = await this.repository.setGeneratedSalesInvoice(databaseName, id, sale.invoiceNumber);
    if (!converted) throw AppError.notFound("Quotation not found.");
    await this.publish("converted", converted, databaseName, sale.invoiceNumber);
    return { quotation: converted, sale };
  }

  private assertDraft(status: QuotationSavePayload["status"], action: string) {
    if (status !== "draft") {
      const actionLabel = action === "confirm" ? "confirmed" : `${action}d`;
      throw AppError.conflict(`Only draft quotations can be ${actionLabel}.`);
    }
  }

  private async publish(action: "created" | "updated" | "confirmed" | "cancelled" | "converted", quotation: { id: string; status: QuotationSavePayload["status"] }, databaseName: string, salesInvoiceNo?: string) {
    const event = createQuotationEvent(action, {
      id: quotation.id,
      status: quotation.status,
      ...(salesInvoiceNo ? { salesInvoiceNo } : {}),
    }, databaseName);
    await this.events.publish(event);
    await this.queue.enqueue("billing.quotation", {
      idempotencyKey: `${event.eventName}:${quotation.id}:${event.occurredAt}`,
      jobName: action === "confirmed" || action === "converted" ? "quotation.confirmation-sync" : "quotation.accounts-preview",
      payload: event.payload,
      sourceModule: "billing.quotation",
      tenantId: databaseName,
    });
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
