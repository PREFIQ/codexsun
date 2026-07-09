import { env } from "../../env.js";
import { SalesRepository } from "./sales.repository.js";
import type { Sale, SaleLineItem, SaleLineItemInput, SaleSavePayload } from "./sales.types.js";
import { BillingSettingsRepository } from "../settings/settings.repository.js";
import { formatBillingDocumentNumber } from "../settings/settings.types.js";

export class SalesService {
  constructor(
    private readonly repository = new SalesRepository(),
    private readonly settings = new BillingSettingsRepository()
  ) {}

  async listSales(databaseName: string) {
    return this.repository.list(databaseName);
  }

  async getSale(databaseName: string, id: string) {
    return this.repository.get(databaseName, id);
  }

  async createSale(databaseName: string, input: SaleSavePayload) {
    const billingSettings = await this.settings.getBillingSettings(databaseName);
    const numbering = billingSettings.numbering.sales;
    const normalizedInput = numbering.automatic
      ? { ...input, invoiceNumber: formatBillingDocumentNumber(numbering) }
      : input;
    const sale = await this.repository.create(databaseName, normalizeSaleInput(normalizedInput));
    if (numbering.automatic) {
      await this.settings.saveBillingSettings(databaseName, {
        ...billingSettings,
        numbering: {
          ...billingSettings.numbering,
          sales: { ...numbering, nextNumber: numbering.nextNumber + 1 }
        }
      });
    }
    await postSaleToAccounts(databaseName, sale, "create");
    return sale;
  }

  async updateSale(databaseName: string, id: string, input: SaleSavePayload) {
    const sale = await this.repository.update(databaseName, id, normalizeSaleInput(input));
    if (sale) await postSaleToAccounts(databaseName, sale, "update");
    return sale;
  }

  async confirmSale(databaseName: string, id: string) {
    return this.repository.setStatus(databaseName, id, "confirmed");
  }

  async cancelSale(databaseName: string, id: string) {
    const sale = await this.repository.setStatus(databaseName, id, "cancelled");
    if (sale) await postSaleToAccounts(databaseName, sale, "cancel");
    return sale;
  }
}

export function normalizeSaleInput(input: SaleSavePayload): SaleSavePayload {
  const items = input.items
    .map(normalizeSaleLineItem)
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
    throw new Error("At least one sale item is required.");
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
  };
}

function normalizeSaleLineItem(item: SaleLineItemInput): SaleLineItemInput {
  return {
    colour: item.colour?.trim() ?? "",
    dcNo: item.dcNo?.trim().toUpperCase() ?? "",
    description: item.description.trim(),
    hsnCode: item.hsnCode.trim().toUpperCase(),
    poNo: item.poNo?.trim().toUpperCase() ?? "",
    quantity: roundMoney(Number(item.quantity) || 0),
    rate: roundMoney(Number(item.rate) || 0),
    size: item.size?.trim() ?? "",
    taxRate: roundMoney(Number(item.taxRate) || 0),
    unit: item.unit.trim().toUpperCase() || "NOS",
  };
}

export function buildSaleTotals(input: SaleSavePayload): Pick<Sale, "amount" | "items" | "subtotal" | "taxAmount"> {
  const items: SaleLineItem[] = input.items.map((item, index) => {
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

async function postSaleToAccounts(databaseName: string, sale: Sale, operation: "create" | "update" | "cancel") {
  const response = await fetch(`${env.ACCOUNTS_API_URL}/accounts/postings/billing`, {
    body: JSON.stringify({
      documentDate: sale.issuedOn,
      operation,
      partyLedgerName: sale.customerName,
      placeOfSupply: "cgst-sgst",
      roundOff: sale.roundOff,
      sourceApp: "billing",
      sourceDocumentId: sale.id,
      sourceDocumentNo: sale.invoiceNumber,
      sourceModule: "sales",
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
