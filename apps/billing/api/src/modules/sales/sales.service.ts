import { env } from "../../env.js";
import { AppError } from "@codexsun/framework/errors";
import { SalesRepository } from "./sales.repository.js";
import type { Sale, SaleLineItem, SaleLineItemInput, SaleSavePayload } from "./sales.types.js";
import { BillingSettingsRepository } from "../settings/settings.repository.js";
import { formatBillingDocumentNumber, nextBillingDocumentNumber } from "../settings/settings.types.js";

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
    const { generated, input: numberedInput, nextNumber } = await resolveNextSaleNumber(databaseName, input, numbering, this.repository);
    const normalizedInput = numberedInput;
    const sale = await this.repository.create(databaseName, normalizeSaleInput(normalizedInput));
    if (numbering.automatic && (generated || nextNumber > numbering.nextNumber)) {
      await this.settings.saveBillingSettings(databaseName, {
        ...billingSettings,
        numbering: {
          ...billingSettings.numbering,
          sales: { ...numbering, nextNumber }
        }
      });
    }
    await postSaleToAccounts(databaseName, sale, "create");
    return sale;
  }

  async updateSale(databaseName: string, id: string, input: SaleSavePayload) {
    const duplicate = await this.repository.findByInvoiceNumber(databaseName, input.invoiceNumber.trim().toUpperCase());
    if (duplicate && duplicate.id !== id) throw AppError.conflict("Sales invoice number already exists. Enter a unique number.");
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
    throw AppError.validation("Customer name is required.");
  }
  if (!input.invoiceNumber.trim()) {
    throw AppError.validation("Invoice number is required.");
  }
  if (!input.issuedOn.trim()) {
    throw AppError.validation("Invoice date is required.");
  }
  if (items.length === 0) {
    throw AppError.validation("Add at least one sale item with a product or description.");
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
    salesLedger: input.salesLedger?.trim() ?? "",
    shippingAddress: input.shippingAddress.trim(),
    status: input.status,
    taxType: input.taxType ?? "cgst-sgst",
    terms: input.terms?.trim() ?? "",
    workOrderNo: input.workOrderNo?.trim() ?? "",
  };
}

export function resolveSaleNumber(input: SaleSavePayload, numbering: Parameters<typeof formatBillingDocumentNumber>[0]): SaleSavePayload & { generated: boolean } {
  const generatedNumber = formatBillingDocumentNumber(numbering);
  const enteredNumber = input.invoiceNumber.trim();
  const generated = numbering.automatic && (!enteredNumber || enteredNumber.toUpperCase() === generatedNumber.toUpperCase());
  return { ...(enteredNumber ? input : { ...input, invoiceNumber: generatedNumber }), generated };
}

async function resolveNextSaleNumber(
  databaseName: string,
  input: SaleSavePayload,
  numbering: Parameters<typeof formatBillingDocumentNumber>[0],
  repository: Pick<SalesRepository, "findByInvoiceNumber">,
) {
  const enteredNumber = input.invoiceNumber.trim();
  const configuredNumber = formatBillingDocumentNumber(numbering);
  const generated = numbering.automatic && (!enteredNumber || enteredNumber.toUpperCase() === configuredNumber.toUpperCase());

  if (!generated) {
    const duplicate = await repository.findByInvoiceNumber(databaseName, enteredNumber.toUpperCase());
    if (duplicate) throw AppError.conflict("Sales invoice number already exists. Enter a unique number.");
    return { generated: false, input, nextNumber: nextBillingDocumentNumber(numbering, enteredNumber) };
  }

  let nextNumber = Math.max(1, numbering.nextNumber);
  while (true) {
    const invoiceNumber = formatBillingDocumentNumber({ ...numbering, nextNumber });
    const duplicate = await repository.findByInvoiceNumber(databaseName, invoiceNumber);
    if (!duplicate) {
      return { generated: true, input: { ...input, invoiceNumber }, nextNumber: nextNumber + 1 };
    }
    nextNumber += 1;
  }
}

function normalizeSaleLineItem(item: SaleLineItemInput): SaleLineItemInput {
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
    unit: item.unit.trim().toUpperCase() || "NOS",
  };
}

export function buildSaleTotals(input: SaleSavePayload): Pick<Sale, "amount" | "items" | "subtotal" | "taxAmount"> {
  const items: SaleLineItem[] = input.items.map((item, index) => {
    const taxableAmount = roundMoney(item.quantity * item.rate);
    const taxAmount = roundMoney(taxableAmount * item.taxRate / 100);
    const cgstAmount = input.taxType === "igst" ? 0 : roundMoney(taxAmount / 2);
    const sgstAmount = input.taxType === "igst" ? 0 : roundMoney(taxAmount / 2);
    const igstAmount = input.taxType === "igst" ? taxAmount : 0;
    return {
      ...item,
      cgstAmount,
      id: `item-${index + 1}`,
      igstAmount,
      lineTotal: roundMoney(taxableAmount + taxAmount),
      sgstAmount,
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
      console.warn(`[sales] Accounts posting deferred for ${sale.invoiceNumber}: ${message || response.statusText}`);
    }
  } catch (error) {
    console.warn(`[sales] Accounts posting deferred for ${sale.invoiceNumber}: ${error instanceof Error ? error.message : String(error)}`);
  }
}
