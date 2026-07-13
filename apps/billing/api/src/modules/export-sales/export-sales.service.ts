import { AppError } from "@codexsun/framework/errors";
import { ExportSalesRepository } from "./export-sales.repository.js";
import type {
  ExportSale,
  ExportSaleLineItem,
  ExportSaleLineItemInput,
  ExportSaleSavePayload
} from "./export-sales.types.js";
import { BillingSettingsRepository } from "../settings/settings.repository.js";
import {
  formatBillingDocumentNumber,
  nextBillingDocumentNumber
} from "../settings/settings.types.js";

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
    const generatedNumber = formatBillingDocumentNumber(numbering);
    const enteredNumber = input.invoiceNumber.trim();
    const generated =
      numbering.automatic &&
      (!enteredNumber || enteredNumber.toUpperCase() === generatedNumber.toUpperCase());
    const normalizedInput = enteredNumber ? input : { ...input, invoiceNumber: generatedNumber };
    const duplicate = await this.repository.findByInvoiceNumber(
      databaseName,
      normalizedInput.invoiceNumber.trim().toUpperCase()
    );
    if (duplicate)
      throw AppError.conflict("Export sales invoice number already exists. Enter a unique number.");
    const sale = await this.repository.create(
      databaseName,
      normalizeExportSaleInput(normalizedInput)
    );
    const nextNumber = nextBillingDocumentNumber(numbering, normalizedInput.invoiceNumber);
    if (numbering.automatic && (generated || nextNumber > numbering.nextNumber)) {
      await this.settings.saveBillingSettings(databaseName, {
        ...billingSettings,
        numbering: {
          ...billingSettings.numbering,
          exportSales: { ...numbering, nextNumber }
        }
      });
    }
    return sale;
  }

  async updateExportSale(databaseName: string, id: string, input: ExportSaleSavePayload) {
    const duplicate = await this.repository.findByInvoiceNumber(
      databaseName,
      input.invoiceNumber.trim().toUpperCase()
    );
    if (duplicate && duplicate.id !== id)
      throw AppError.conflict("Export sales invoice number already exists. Enter a unique number.");
    const sale = await this.repository.update(databaseName, id, normalizeExportSaleInput(input));
    return sale;
  }

  async confirmExportSale(databaseName: string, id: string) {
    return this.repository.setStatus(databaseName, id, "confirmed");
  }

  async cancelExportSale(databaseName: string, id: string) {
    const sale = await this.repository.setStatus(databaseName, id, "cancelled");
    return sale;
  }

  async revokeExportSale(databaseName: string, id: string) {
    const current = await this.repository.get(databaseName, id);
    if (!current) return null;
    if (current.status !== "confirmed")
      throw AppError.conflict("Only confirmed export sales can be revoked.");
    return this.repository.revoke(databaseName, id);
  }

  async deleteExportSale(databaseName: string, id: string) {
    const current = await this.repository.get(databaseName, id);
    if (!current) return null;
    if (current.status !== "draft")
      throw AppError.conflict("Only draft export sales can be deleted.");
    return this.repository.delete(databaseName, id);
  }
}

export function normalizeExportSaleInput(input: ExportSaleSavePayload): ExportSaleSavePayload {
  const items = input.items
    .map(normalizeExportSaleLineItem)
    .filter((item) => item.description.length > 0 && item.quantity > 0);

  if (!input.customerName.trim()) {
    throw AppError.validation("Customer name is required.");
  }
  if (!input.invoiceNumber.trim()) {
    throw AppError.validation("Invoice number is required.");
  }
  if (!input.issuedOn.trim()) {
    throw AppError.validation("Invoice date is required.");
  }
  if (items.length === 0) {
    throw AppError.validation("Add at least one export sales item with a product or description.");
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
    workOrderNo: input.workOrderNo?.trim() ?? ""
  };
}

export const normalizeSaleInput = normalizeExportSaleInput;

function normalizeExportSaleLineItem(item: ExportSaleLineItemInput): ExportSaleLineItemInput {
  return {
    colour: item.colour?.trim() ?? "",
    dcNo: item.dcNo?.trim().toUpperCase() ?? "",
    description: item.description.trim() || item.productName.trim(),
    hsnCode: item.hsnCode.trim().toUpperCase(),
    poNo: item.poNo?.trim().toUpperCase() ?? "",
    productName: item.productName.trim(),
    quantity: roundMoney(Number(item.quantity) || 0),
    rate: roundMoney(Number(item.rate) || 0),
    size: item.size?.trim() ?? "",
    taxRate: roundMoney(Number(item.taxRate) || 0),
    unit: item.unit.trim().toUpperCase() || "NOS"
  };
}

export function buildExportSaleTotals(
  input: ExportSaleSavePayload
): Pick<ExportSale, "amount" | "items" | "subtotal" | "taxAmount"> {
  const items: ExportSaleLineItem[] = input.items.map((item, index) => {
    const taxableAmount = roundMoney(item.quantity * item.rate);
    const taxAmount = roundMoney((taxableAmount * item.taxRate) / 100);
    return {
      ...item,
      id: `item-${index + 1}`,
      lineTotal: roundMoney(taxableAmount + taxAmount),
      taxableAmount,
      taxAmount
    };
  });

  const subtotal = roundMoney(items.reduce((total, item) => total + item.taxableAmount, 0));
  const taxAmount = roundMoney(items.reduce((total, item) => total + item.taxAmount, 0));
  const amount = roundMoney(subtotal + taxAmount + Number(input.roundOff ?? 0));

  return {
    amount,
    items,
    subtotal,
    taxAmount
  };
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}
