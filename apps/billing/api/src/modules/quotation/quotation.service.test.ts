import { describe, expect, it, vi } from "vitest";
import { InMemoryEventPublisher } from "@codexsun/framework/events";
import { InMemoryQueueAdapter } from "@codexsun/framework/queue";
import { defaultBillingSettings } from "../settings/settings.types.js";
import { QuotationService } from "./quotation.service.js";
import type { Quotation, QuotationSavePayload } from "./quotation.types.js";

const payload: QuotationSavePayload = {
  billingAddress: "",
  customerName: "Acme Textiles",
  date: "2026-07-10",
  items: [{ colour: "", dcNo: "", description: "Fabric", hsnCode: "5208", poNo: "", productName: "Cotton", quantity: 2, rate: 100, size: "", taxRate: 18, unit: "Nos" }],
  notes: "",
  quotationNumber: "QUO-0001",
  salesLedger: "",
  shippingAddress: "",
  status: "draft",
  taxType: "cgst-sgst",
  terms: "",
  workOrderNo: "",
};

function quotation(overrides: Partial<Quotation> = {}): Quotation {
  return {
    amount: 236,
    billingAddress: "",
    createdAt: "2026-07-10T00:00:00.000Z",
    customerName: payload.customerName,
    date: payload.date,
    generatedSalesInvoiceNo: "",
    id: "quotation-1",
    items: [{ colour: "", dcNo: "", description: "Fabric", hsnCode: "5208", poNo: "", productName: "Cotton", quantity: 2, rate: 100, size: "", taxRate: 18, unit: "Nos", cgstAmount: 18, id: "item-1", igstAmount: 0, lineTotal: 236, sgstAmount: 18, taxAmount: 36, taxableAmount: 200 }],
    notes: "",
    quotationNumber: payload.quotationNumber,
    roundOff: 0,
    salesLedger: "",
    shippingAddress: "",
    status: "draft",
    subtotal: 200,
    taxAmount: 36,
    taxType: "cgst-sgst",
    terms: "",
    updatedAt: "2026-07-10T00:00:00.000Z",
    workOrderNo: "",
    ...overrides,
  };
}

function createService(current = quotation()) {
  const repository = {
    create: vi.fn(async (_database: string, input: QuotationSavePayload) => quotation({ customerName: input.customerName, date: input.date, quotationNumber: input.quotationNumber })),
    findByNumber: vi.fn(async () => null),
    get: vi.fn(async () => current),
    setGeneratedSalesInvoice: vi.fn(async (_database: string, _id: string, invoiceNumber: string) => quotation({ generatedSalesInvoiceNo: invoiceNumber, status: "confirmed" })),
    setStatus: vi.fn(async (_database: string, _id: string, status: Quotation["status"]) => quotation({ status })),
    update: vi.fn(async (_database: string, _id: string, input: QuotationSavePayload) => quotation({ customerName: input.customerName, date: input.date, quotationNumber: input.quotationNumber })),
  };
  const settings = {
    getBillingSettings: vi.fn(async () => structuredClone(defaultBillingSettings)),
    saveBillingSettings: vi.fn(async () => undefined),
  };
  const sales = {
    createSale: vi.fn(async () => ({ invoiceNumber: "SAL-0001" })),
  };
  const events = new InMemoryEventPublisher();
  const queue = new InMemoryQueueAdapter();
  return { events, queue, repository, sales, service: new QuotationService(repository as never, settings as never, sales as never, events, queue) };
}

describe("QuotationService", () => {
  it("uses configured automatic numbering and queues the quotation-created event", async () => {
    const { events, queue, repository, service } = createService();

    const created = await service.create("tenant_billing", { ...payload, quotationNumber: "" });

    expect(created.quotationNumber).toBe("QUO-0001");
    expect(repository.findByNumber).toHaveBeenCalledWith("tenant_billing", "QUO-0001");
    expect(events.events[0]?.eventName).toBe("billing.quotation.changed");
    expect(queue.jobs[0]?.job.jobName).toBe("quotation.accounts-preview");
  });

  it("does not allow a confirmed quotation to be edited or confirmed again", async () => {
    const { service } = createService(quotation({ status: "confirmed" }));

    await expect(service.update("tenant_billing", "quotation-1", payload)).rejects.toThrow("Only draft quotations can be updated.");
    await expect(service.confirm("tenant_billing", "quotation-1")).rejects.toThrow("Only draft quotations can be confirmed.");
  });

  it("converts a quotation once, stores its sales invoice, and queues confirmation sync", async () => {
    const { queue, repository, sales, service } = createService();

    const result = await service.convertToSale("tenant_billing", "quotation-1");

    expect(result?.sale.invoiceNumber).toBe("SAL-0001");
    expect(sales.createSale).toHaveBeenCalledOnce();
    expect(repository.setGeneratedSalesInvoice).toHaveBeenCalledWith("tenant_billing", "quotation-1", "SAL-0001");
    expect(queue.jobs[0]?.job.jobName).toBe("quotation.confirmation-sync");
  });
});
