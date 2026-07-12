import { env } from "../../env.js";
import { AppError } from "@codexsun/framework/errors";
import { PurchaseRepository } from "./purchase.repository.js";
import type {
  Purchase,
  PurchaseLineItem,
  PurchaseLineItemInput,
  PurchaseSavePayload
} from "./purchase.types.js";
import { BillingSettingsRepository } from "../settings/settings.repository.js";
import {
  formatBillingDocumentNumber,
  nextBillingDocumentNumber
} from "../settings/settings.types.js";

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
      throw AppError.conflict("Purchase invoice number already exists. Enter a unique number.");
    const sale = await this.repository.create(
      databaseName,
      normalizePurchaseInput(normalizedInput)
    );
    const nextNumber = nextBillingDocumentNumber(numbering, normalizedInput.invoiceNumber);
    if (numbering.automatic && (generated || nextNumber > numbering.nextNumber)) {
      await this.settings.saveBillingSettings(databaseName, {
        ...billingSettings,
        numbering: {
          ...billingSettings.numbering,
          purchase: { ...numbering, nextNumber }
        }
      });
    }
    await postPurchaseToAccounts(databaseName, sale, "create");
    return sale;
  }

  async updatePurchase(databaseName: string, id: string, input: PurchaseSavePayload) {
    const duplicate = await this.repository.findByInvoiceNumber(
      databaseName,
      input.invoiceNumber.trim().toUpperCase()
    );
    if (duplicate && duplicate.id !== id)
      throw AppError.conflict("Purchase invoice number already exists. Enter a unique number.");
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

  async revokePurchase(databaseName: string, id: string) {
    return this.repository.revoke(databaseName, id);
  }

  async deletePurchase(databaseName: string, id: string) {
    return this.repository.delete(databaseName, id);
  }
}

export function normalizePurchaseInput(input: PurchaseSavePayload): PurchaseSavePayload {
  const items = input.items
    .map(normalizePurchaseLineItem)
    .filter((item) => item.description.length > 0 && item.quantity > 0);

  if (!input.customerName.trim()) {
    throw AppError.validation("Supplier name is required.");
  }
  if (!input.invoiceNumber.trim()) {
    throw AppError.validation("Invoice number is required.");
  }
  if (!input.issuedOn.trim()) {
    throw AppError.validation("Invoice date is required.");
  }
  if (items.length === 0) {
    throw AppError.validation("Add at least one purchase item with a product or description.");
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
    workOrderNo: input.workOrderNo?.trim() ?? ""
  };
}

export const normalizeSaleInput = normalizePurchaseInput;

function normalizePurchaseLineItem(item: PurchaseLineItemInput): PurchaseLineItemInput {
  const productName = item.productName?.trim() ?? "";
  return {
    colour: item.colour?.trim() ?? "",
    dcNo: item.dcNo?.trim().toUpperCase() ?? "",
    description: item.description.trim() || productName,
    hsnCode: item.hsnCode.trim().toUpperCase(),
    poNo: item.poNo?.trim().toUpperCase() ?? "",
    productName,
    quantity: roundMoney(Number(item.quantity) || 0),
    rate: roundMoney(Number(item.rate) || 0),
    size: item.size?.trim() ?? "",
    taxRate: roundMoney(Number(item.taxRate) || 0),
    unit: item.unit.trim().toUpperCase() || "NOS"
  };
}

export function buildPurchaseTotals(
  input: PurchaseSavePayload
): Pick<Purchase, "amount" | "items" | "subtotal" | "taxAmount"> {
  const items: PurchaseLineItem[] = input.items.map((item, index) => {
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

async function postPurchaseToAccounts(
  databaseName: string,
  sale: Purchase,
  operation: "create" | "update" | "cancel"
) {
  try {
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
      console.warn(
        `[purchase] Accounts posting deferred for ${sale.invoiceNumber}: ${message || response.statusText}`
      );
    }
  } catch (error) {
    console.warn(
      `[purchase] Accounts posting deferred for ${sale.invoiceNumber}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
