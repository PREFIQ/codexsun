import { env } from "../../env.js";
import { PurchaseRepository } from "./purchase.repository.js";
import type { Purchase, PurchaseLineItem, PurchaseLineItemInput, PurchaseSavePayload } from "./purchase.types.js";
import { BillingSettingsRepository } from "../settings/settings.repository.js";
import { formatBillingDocumentNumber } from "../settings/settings.types.js";

export class PurchaseService {
  constructor(
    private readonly repository = new PurchaseRepository(),
    private readonly settings = new BillingSettingsRepository()
  ) {}

  async listPurchases(databaseName: string) {
    return this.repository.list(databaseName);
  }

  async getPurchase(databaseName: string, id: string) {
    return this.repository.get(databaseName, id);
  }

  async createPurchase(databaseName: string, input: PurchaseSavePayload) {
    const billingSettings = await this.settings.getBillingSettings(databaseName);
    const numbering = billingSettings.numbering.purchase;
    const normalizedInput = numbering.automatic
      ? { ...input, invoiceNumber: formatBillingDocumentNumber(numbering) }
      : input;
    const sale = await this.repository.create(databaseName, normalizePurchaseInput(normalizedInput));
    if (numbering.automatic) {
      await this.settings.saveBillingSettings(databaseName, {
        ...billingSettings,
        numbering: {
          ...billingSettings.numbering,
          purchase: { ...numbering, nextNumber: numbering.nextNumber + 1 }
        }
      });
    }
    await postPurchaseToAccounts(databaseName, sale, "create");
    return sale;
  }

  async updatePurchase(databaseName: string, id: string, input: PurchaseSavePayload) {
    const sale = await this.repository.update(databaseName, id, normalizePurchaseInput(input));
    if (sale) await postPurchaseToAccounts(databaseName, sale, "update");
    return sale;
  }

  async confirmPurchase(databaseName: string, id: string) {
    return this.repository.setStatus(databaseName, id, "confirmed");
  }

  async cancelPurchase(databaseName: string, id: string) {
    const sale = await this.repository.setStatus(databaseName, id, "cancelled");
    if (sale) await postPurchaseToAccounts(databaseName, sale, "cancel");
    return sale;
  }
}

export function normalizePurchaseInput(input: PurchaseSavePayload): PurchaseSavePayload {
  const items = input.items
    .map(normalizePurchaseLineItem)
    .filter((item) => item.description.length > 0 && item.quantity > 0);

  if (!input.customerName.trim()) {
    throw new Error("Supplier name is required.");
  }
  if (!input.invoiceNumber.trim()) {
    throw new Error("Invoice number is required.");
  }
  if (!input.issuedOn.trim()) {
    throw new Error("Invoice date is required.");
  }
  if (items.length === 0) {
    throw new Error("At least one purchase item is required.");
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
    supplierBillDate: input.supplierBillDate?.trim() ?? "",
    supplierBillNo: input.supplierBillNo?.trim().toUpperCase() ?? "",
    taxType: input.taxType?.trim() || "CGST + SGST",
    workOrderNo: input.workOrderNo?.trim() ?? "",
  };
}

export const normalizeSaleInput = normalizePurchaseInput;

function normalizePurchaseLineItem(item: PurchaseLineItemInput): PurchaseLineItemInput {
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

export function buildPurchaseTotals(input: PurchaseSavePayload): Pick<Purchase, "amount" | "items" | "subtotal" | "taxAmount"> {
  const items: PurchaseLineItem[] = input.items.map((item, index) => {
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

async function postPurchaseToAccounts(databaseName: string, sale: Purchase, operation: "create" | "update" | "cancel") {
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
      sourceModule: "purchase",
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
