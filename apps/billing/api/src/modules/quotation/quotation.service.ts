import { AppError } from "@codexsun/framework/errors";
import { InMemoryEventPublisher, type EventPublisher } from "@codexsun/framework/events";
import { InMemoryQueueAdapter, type QueueAdapter } from "@codexsun/framework/queue";
import { SalesService } from "../sales/sales.service.js";
import type { SaleLineItemInput } from "../sales/sales.types.js";
import { createQuotationEvent } from "./quotation.events.js";
import { QuotationRepository } from "./quotation.repository.js";
import type { QuotationLineItemInput, QuotationSavePayload } from "./quotation.types.js";
import { BillingSettingsRepository } from "../settings/settings.repository.js";
import {
  formatBillingDocumentNumber,
  nextBillingDocumentNumber
} from "../settings/settings.types.js";

export class QuotationService {
  constructor(
    private readonly repository = new QuotationRepository(),
    private readonly settings = new BillingSettingsRepository(),
    private readonly sales = new SalesService(),
    private readonly events: EventPublisher = new InMemoryEventPublisher(),
    private readonly queue: QueueAdapter = new InMemoryQueueAdapter()
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
    const generatedNumber = formatBillingDocumentNumber(numbering);
    const enteredNumber = input.quotationNumber.trim();
    const generated =
      numbering.automatic &&
      (!enteredNumber || enteredNumber.toUpperCase() === generatedNumber.toUpperCase());
    const normalizedInput = enteredNumber ? input : { ...input, quotationNumber: generatedNumber };
    const payload = normalizeInput(normalizedInput);
    const existing = await this.repository.findByNumber(databaseName, payload.quotationNumber);
    if (existing)
      throw AppError.conflict("Quotation number already exists. Enter a unique quotation number.");
    const quotation = await this.repository.create(databaseName, payload);
    const nextNumber = nextBillingDocumentNumber(numbering, payload.quotationNumber);
    if (numbering.automatic && (generated || nextNumber > numbering.nextNumber)) {
      await this.settings.saveBillingSettings(databaseName, {
        ...billingSettings,
        numbering: {
          ...billingSettings.numbering,
          quotation: { ...numbering, nextNumber: nextNumber }
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
    if (duplicate && duplicate.id !== id)
      throw AppError.conflict("Quotation number already exists. Enter a unique quotation number.");
    const quotation = await this.repository.update(databaseName, id, payload);
    if (quotation) await this.publish("updated", quotation, databaseName);
    return quotation;
  }

  async deleteDraft(databaseName: string, id: string) {
    const current = await this.repository.get(databaseName, id);
    if (!current) return null;
    if (current.status !== "draft" || current.generatedSalesInvoiceNo) {
      throw AppError.conflict("Only draft quotations without an invoice can be force deleted.");
    }
    return this.repository.delete(databaseName, id);
  }

  async confirm(databaseName: string, id: string) {
    const current = await this.repository.get(databaseName, id);
    if (!current) return null;
    this.assertDraft(current.status, "confirm");
    const quotation = await this.repository.setStatus(databaseName, id, "confirmed");
    if (quotation) await this.publish("confirmed", quotation, databaseName);
    return quotation;
  }

  async revoke(databaseName: string, id: string) {
    const current = await this.repository.get(databaseName, id);
    if (!current) return null;
    if (current.generatedSalesInvoiceNo)
      throw AppError.conflict("An invoiced quotation cannot be revoked.");
    if (current.status === "draft")
      throw AppError.conflict("A draft quotation does not need to be revoked.");
    const quotation = await this.repository.setStatus(databaseName, id, "draft");
    if (quotation) await this.publish("updated", quotation, databaseName);
    return quotation;
  }

  async cancel(databaseName: string, id: string) {
    const current = await this.repository.get(databaseName, id);
    if (!current) return null;
    if (current.status === "cancelled") throw AppError.conflict("Quotation is already cancelled.");
    if (current.generatedSalesInvoiceNo)
      throw AppError.conflict("A converted quotation cannot be cancelled.");
    const quotation = await this.repository.setStatus(databaseName, id, "cancelled");
    if (quotation) await this.publish("cancelled", quotation, databaseName);
    return quotation;
  }

  async convertToSale(databaseName: string, id: string) {
    const quotation = await this.repository.get(databaseName, id);
    if (!quotation) return null;
    if (quotation.status === "cancelled")
      throw AppError.conflict("A cancelled quotation cannot be converted.");
    if (quotation.generatedSalesInvoiceNo)
      throw AppError.conflict(
        `Quotation is already converted to ${quotation.generatedSalesInvoiceNo}.`
      );

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
        unit: item.unit
      })),
      notes: quotation.notes,
      roundOff: quotation.roundOff,
      shippingAddress: quotation.shippingAddress,
      status: "draft"
    });
    if (!salesNumbering.automatic) {
      await this.settings.saveBillingSettings(databaseName, {
        ...billingSettings,
        numbering: {
          ...billingSettings.numbering,
          sales: { ...salesNumbering, nextNumber: salesNumbering.nextNumber + 1 }
        }
      });
    }
    const converted = await this.repository.setGeneratedSalesInvoice(
      databaseName,
      id,
      sale.invoiceNumber
    );
    if (!converted) throw AppError.notFound("Quotation not found.");
    await this.publish("converted", converted, databaseName, sale.invoiceNumber);
    return { quotation: converted, sale };
  }

  async convertManyToSale(databaseName: string, ids: string[]) {
    const uniqueIds = Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean)));
    if (!uniqueIds.length) throw AppError.conflict("Select at least one quotation.");

    const quotations = await Promise.all(
      uniqueIds.map((id) => this.repository.get(databaseName, id))
    );
    if (quotations.some((quotation) => !quotation))
      throw AppError.notFound("One or more quotations were not found.");
    const selected = quotations.filter((quotation): quotation is NonNullable<typeof quotation> =>
      Boolean(quotation)
    );
    if (!selected.length) throw AppError.notFound("One or more quotations were not found.");
    const first = selected[0]!;
    const contactKey = quotationContactKey(first);

    if (selected.some((quotation) => quotationContactKey(quotation) !== contactKey)) {
      throw AppError.conflict("Selected quotations must belong to the same contact.");
    }
    for (const quotation of selected) {
      if (quotation.status === "cancelled")
        throw AppError.conflict(
          `Cancelled quotation ${quotation.quotationNumber} cannot be invoiced.`
        );
      if (quotation.generatedSalesInvoiceNo)
        throw AppError.conflict(
          `Quotation ${quotation.quotationNumber} is already invoiced by ${quotation.generatedSalesInvoiceNo}.`
        );
    }

    const billingSettings = await this.settings.getBillingSettings(databaseName);
    const salesNumbering = billingSettings.numbering.sales;
    const sale = await this.sales.createSale(databaseName, {
      billingAddress: first.billingAddress,
      currencyCode: "INR",
      customerEmail: "",
      customerName: first.customerName,
      customerPhone: "",
      invoiceNumber: formatBillingDocumentNumber(salesNumbering),
      issuedOn: new Date().toISOString().slice(0, 10),
      items: mergeQuotationItems(selected),
      notes: selected
        .map((quotation) => quotation.notes)
        .filter(Boolean)
        .join("\n"),
      roundOff: selected.reduce((sum, quotation) => sum + quotation.roundOff, 0),
      shippingAddress: first.shippingAddress,
      status: "draft"
    });
    if (!salesNumbering.automatic) {
      await this.settings.saveBillingSettings(databaseName, {
        ...billingSettings,
        numbering: {
          ...billingSettings.numbering,
          sales: { ...salesNumbering, nextNumber: salesNumbering.nextNumber + 1 }
        }
      });
    }

    const converted = [];
    for (const quotation of selected) {
      const updated = await this.repository.setGeneratedSalesInvoice(
        databaseName,
        quotation.id,
        sale.invoiceNumber
      );
      if (!updated)
        throw AppError.notFound(`Quotation ${quotation.quotationNumber} was not found.`);
      await this.publish("converted", updated, databaseName, sale.invoiceNumber);
      converted.push(updated);
    }
    return { quotations: converted, sale };
  }

  private assertDraft(status: QuotationSavePayload["status"], action: string) {
    if (status !== "draft") {
      const actionLabel = action === "confirm" ? "confirmed" : `${action}d`;
      throw AppError.conflict(`Only draft quotations can be ${actionLabel}.`);
    }
  }

  private async publish(
    action: "created" | "updated" | "confirmed" | "cancelled" | "converted",
    quotation: { id: string; status: QuotationSavePayload["status"] },
    databaseName: string,
    salesInvoiceNo?: string
  ) {
    const event = createQuotationEvent(
      action,
      {
        id: quotation.id,
        status: quotation.status,
        ...(salesInvoiceNo ? { salesInvoiceNo } : {})
      },
      databaseName
    );
    await this.events.publish(event);
    await this.queue.enqueue("billing.quotation", {
      idempotencyKey: `${event.eventName}:${quotation.id}:${event.occurredAt}`,
      jobName:
        action === "confirmed" || action === "converted"
          ? "quotation.confirmation-sync"
          : "quotation.accounts-preview",
      payload: event.payload,
      sourceModule: "billing.quotation",
      tenantId: databaseName
    });
  }
}

function normalizeInput(input: QuotationSavePayload): QuotationSavePayload {
  const items = input.items
    .map(normalizeItem)
    .filter((item) => item.productName.length > 0 && item.quantity > 0);
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
    workOrderNo: input.workOrderNo.trim()
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
    unit: item.unit.trim().toUpperCase() || "NOS"
  };
}

function quotationContactKey(quotation: { customerName: string }) {
  return quotation.customerName.trim().toLowerCase();
}

function mergeQuotationItems(
  quotations: Array<{ items: QuotationLineItemInput[] }>
): SaleLineItemInput[] {
  const merged = new Map<string, SaleLineItemInput>();
  for (const quotation of quotations) {
    for (const item of quotation.items) {
      const normalized = {
        colour: item.colour,
        dcNo: item.dcNo,
        description: [item.productName, item.description].filter(Boolean).join(" - "),
        hsnCode: item.hsnCode,
        poNo: item.poNo,
        quantity: item.quantity,
        rate: item.rate,
        size: item.size,
        taxRate: item.taxRate,
        unit: item.unit
      } satisfies SaleLineItemInput;
      const key = [
        normalized.description,
        normalized.hsnCode,
        normalized.colour,
        normalized.dcNo,
        normalized.poNo,
        normalized.size,
        normalized.unit,
        normalized.rate,
        normalized.taxRate
      ]
        .map((value) =>
          String(value ?? "")
            .trim()
            .toLowerCase()
        )
        .join("|");
      const existing = merged.get(key);
      if (existing) existing.quantity += normalized.quantity;
      else merged.set(key, { ...normalized });
    }
  }
  return Array.from(merged.values());
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}
