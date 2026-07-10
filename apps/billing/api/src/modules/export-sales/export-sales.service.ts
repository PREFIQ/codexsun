import { env } from "../../env.js";
import { ExportSalesRepository } from "./export-sales.repository.js";
import type { ExportSale, ExportSaleLineItem, ExportSaleLineItemInput, ExportSaleSavePayload } from "./export-sales.types.js";
import { BillingSettingsRepository } from "../settings/settings.repository.js";
import { formatBillingDocumentNumber } from "../settings/settings.types.js";

export class ExportSalesService {
  constructor(
    private readonly repository = new ExportSalesRepository(),
    private readonly settings = new BillingSettingsRepository()
  ) {}

  async listExportSales(databaseName: string) {
    return this.repository.list(databaseName);
  }

  async getExportSale(databaseName: string, id: string) {
    return this.repository.get(databaseName, id);
  }

  async createExportSale(databaseName: string, input: ExportSaleSavePayload) {
    const billingSettings = await this.settings.getBillingSettings(databaseName);
    const numbering = billingSettings.numbering.exportSales;
    const normalizedInput = numbering.automatic
      ? { ...input, invoiceNumber: formatBillingDocumentNumber(numbering) }
      : input;
    const sale = await this.repository.create(databaseName, normalizeExportSaleInput(normalizedInput));
    if (numbering.automatic) {
      await this.settings.saveBillingSettings(databaseName, {
        ...billingSettings,
        numbering: {
          ...billingSettings.numbering,
          exportSales: { ...numbering, nextNumber: numbering.nextNumber + 1 }
        }
      });
    }
    await postExportSaleToAccounts(databaseName, sale, "create");
    return sale;
  }

  async updateExportSale(databaseName: string, id: string, input: ExportSaleSavePayload) {
    const sale = await this.repository.update(databaseName, id, normalizeExportSaleInput(input));
    if (sale) await postExportSaleToAccounts(databaseName, sale, "update");
    return sale;
  }

  async confirmExportSale(databaseName: string, id: string) {
    return this.repository.setStatus(databaseName, id, "confirmed");
  }

  async cancelExportSale(databaseName: string, id: string) {
    const sale = await this.repository.setStatus(databaseName, id, "cancelled");
    if (sale) await postExportSaleToAccounts(databaseName, sale, "cancel");
    return sale;
  }
}

export function normalizeExportSaleInput(input: ExportSaleSavePayload): ExportSaleSavePayload {
  const items = input.items
    .map(normalizeExportSaleLineItem)
    .filter((item) => item.description.length > 0 && item.quantity > 0);

  if (!input.customerName.trim()) {
    throw new Error("Customer name is required.");
  }
  if (!input.invoiceNumber.trim()) {
    throw new Error("Invoice number is required.");
  }
  if (!input.issuedOn.trim()) {
    throw new Error("Invoice date is required.");
  }
  if (items.length === 0) {
    throw new Error("At least one export sales item is required.");
  }

  return {
    billingAddress: input.billingAddress.trim(),
    currencyCode: input.currencyCode.trim().toUpperCase() || "INR",
    customerEmail: input.customerEmail.trim().toLowerCase(),
    customerName: input.customerName.trim(),
    customerPhone: input.customerPhone.trim(),
    invoiceNumber: input.invoiceNumber.trim().toUpperCase(),
    issuedOn: input.issuedOn.trim(),
    items,
    notes: input.notes.trim(),
    roundOff: Number(input.roundOff ?? 0) || 0,
    shippingAddress: input.shippingAddress.trim(),
    status: input.status,
    taxType: input.taxType?.trim() || "IGST",
    workOrderNo: input.workOrderNo?.trim() ?? "",
  };
}

export const normalizeSaleInput = normalizeExportSaleInput;

function normalizeExportSaleLineItem(item: ExportSaleLineItemInput): ExportSaleLineItemInput {
  return {
    colour: item.colour?.trim() ?? "",
    dcNo: item.dcNo?.trim().toUpperCase() ?? "",
    description: item.description.trim(),
    hsnCode: item.hsnCode.trim().toUpperCase(),
    poNo: item.poNo?.trim().toUpperCase() ?? "",
    productName: item.productName.trim(),
    quantity: roundMoney(Number(item.quantity) || 0),
    rate: roundMoney(Number(item.rate) || 0),
    size: item.size?.trim() ?? "",
    taxRate: roundMoney(Number(item.taxRate) || 0),
    unit: item.unit.trim().toUpperCase() || "NOS",
  };
}

export function buildExportSaleTotals(input: ExportSaleSavePayload): Pick<ExportSale, "amount" | "items" | "subtotal" | "taxAmount"> {
  const items: ExportSaleLineItem[] = input.items.map((item, index) => {
    const taxableAmount = roundMoney(item.quantity * item.rate);
    const taxAmount = roundMoney(taxableAmount * item.taxRate / 100);
    return {
      ...item,
      id: `item-${index + 1}`,
      lineTotal: roundMoney(taxableAmount + taxAmount),
      taxableAmount,
      taxAmount,
    };
  });

  const subtotal = roundMoney(items.reduce((total, item) => total + item.taxableAmount, 0));
  const taxAmount = roundMoney(items.reduce((total, item) => total + item.taxAmount, 0));
  const amount = roundMoney(subtotal + taxAmount + Number(input.roundOff ?? 0));

  return {
    amount,
    items,
    subtotal,
    taxAmount,
  };
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

async function postExportSaleToAccounts(databaseName: string, sale: ExportSale, operation: "create" | "update" | "cancel") {
  const response = await fetch(`${env.ACCOUNTS_API_URL}/accounts/postings/billing`, {
    body: JSON.stringify({
      documentDate: sale.issuedOn,
      operation,
      partyLedgerName: sale.customerName,
      placeOfSupply: sale.taxType,
      roundOff: sale.roundOff,
      sourceApp: "billing",
      sourceDocumentId: sale.id,
      sourceDocumentNo: sale.invoiceNumber,
      sourceModule: "export-sales",
      taxableAmount: sale.subtotal,
      taxAmount: sale.taxAmount,
      totalAmount: sale.amount
    }),
    headers: {
      "Content-Type": "application/json",
      "x-tenant-db": databaseName
    },
    method: "POST"
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(`Accounts posting failed for ${sale.invoiceNumber}: ${message || response.statusText}`);
  }
}
