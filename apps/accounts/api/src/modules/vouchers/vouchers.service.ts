import { LedgersRepository } from "../ledgers/ledgers.repository.js";
import { AccountsSettingsRepository } from "../settings/settings.repository.js";
import type { Ledger } from "../ledgers/ledgers.types.js";
import { VouchersRepository } from "./vouchers.repository.js";
import type {
  AccountsPostingRequest,
  VoucherLineInput,
  VoucherSavePayload,
  VoucherType
} from "./vouchers.types.js";

const voucherTypes: VoucherType[] = [
  "sales",
  "purchase",
  "receipt",
  "payment",
  "contra",
  "journal",
  "credit_note",
  "debit_note"
];

export class VouchersService {
  constructor(
    private readonly repository = new VouchersRepository(),
    private readonly ledgers = new LedgersRepository(),
    private readonly settings = new AccountsSettingsRepository()
  ) {}

  list(databaseName: string, search = "") {
    return this.repository.list(databaseName, search);
  }

  get(databaseName: string, id: string) {
    return this.repository.get(databaseName, id);
  }

  async create(databaseName: string, input: VoucherSavePayload) {
    const payload = this.normalize(input);
    const settings = await this.settings.get(databaseName);
    if (!payload.voucherNo?.trim() && settings.voucherNumbering.mode === "manual") {
      throw new Error("Voucher number is required when manual numbering is enabled.");
    }
    await this.assertPeriodOpen(databaseName, payload.voucherDate);
    const totals = totalsFor(payload.lines);
    assertBalanced(totals);
    const voucher = await this.repository.create(databaseName, payload, totals);
    await this.ledgers.recalculateAll(databaseName);
    return voucher;
  }

  async cancel(databaseName: string, id: string) {
    const existing = await this.repository.get(databaseName, id);
    if (existing) await this.assertPeriodOpen(databaseName, existing.voucherDate);
    const voucher = await this.repository.markStatus(databaseName, id, "cancelled");
    await this.ledgers.recalculateAll(databaseName);
    return voucher;
  }

  async postSource(databaseName: string, request: AccountsPostingRequest) {
    await this.assertPeriodOpen(databaseName, request.documentDate);
    if (request.operation === "cancel" || request.operation === "delete") {
      const existing = await this.repository.findActiveBySource(
        databaseName,
        request.sourceApp,
        request.sourceModule,
        request.sourceDocumentId
      );
      if (!existing) return null;
      return this.reverse(
        databaseName,
        existing.id,
        `${request.sourceDocumentNo} ${request.operation} reversal`
      );
    }

    const existing = await this.repository.findActiveBySource(
      databaseName,
      request.sourceApp,
      request.sourceModule,
      request.sourceDocumentId
    );
    if (existing && request.operation === "update") {
      await this.reverse(databaseName, existing.id, `${request.sourceDocumentNo} update reversal`);
    }

    const payload = await this.payloadFromPosting(databaseName, request);
    return this.create(databaseName, payload);
  }

  async reverse(databaseName: string, id: string, narration: string) {
    const existing = await this.repository.get(databaseName, id);
    if (!existing) return null;
    await this.assertPeriodOpen(databaseName, existing.voucherDate);
    await this.repository.markStatus(databaseName, id, "reversed");
    const reversal = await this.create(databaseName, {
      lines: existing.lines.map((line) => ({
        amount: line.amount,
        dc: line.dc === "debit" ? "credit" : "debit",
        ledgerId: line.ledgerId,
        narration: `Reversal of ${existing.voucherNo}`
      })),
      narration,
      sourceApp: existing.sourceApp,
      sourceDocumentId: existing.sourceDocumentId,
      sourceDocumentNo: existing.sourceDocumentNo,
      sourceModule: existing.sourceModule,
      sourceOperation: "cancel",
      status: "posted",
      voucherDate: new Date().toISOString().slice(0, 10),
      voucherType: existing.voucherType
    });
    await this.ledgers.recalculateAll(databaseName);
    return reversal;
  }

  private normalize(input: VoucherSavePayload): VoucherSavePayload {
    if (!voucherTypes.includes(input.voucherType)) throw new Error("Voucher type is invalid.");
    if (!input.voucherDate) throw new Error("Voucher date is required.");
    if (!input.lines.length) throw new Error("Voucher lines are required.");
    return {
      ...input,
      lines: input.lines.map((line) => ({
        amount: round(Number(line.amount ?? 0)),
        dc: line.dc,
        ledgerId: line.ledgerId,
        narration: line.narration ?? null
      }))
    };
  }

  private async payloadFromPosting(
    databaseName: string,
    request: AccountsPostingRequest
  ): Promise<VoucherSavePayload> {
    const party = await this.partyLedger(databaseName, request);
    const trade = await this.requiredLedger(
      databaseName,
      request.sourceModule === "purchase" ? "PURCHASE" : "SALES"
    );
    const settings = await this.settings.get(databaseName);
    const roundOff = await this.requiredLedger(
      databaseName,
      settings.postingRules.roundOffLedgerCode || "ROUND_OFF"
    );
    const lines: VoucherLineInput[] = [];
    const taxAmount = round(Number(request.taxAmount ?? 0));
    const taxableAmount = round(
      Number(
        request.taxableAmount ??
          Math.max(0, request.totalAmount - taxAmount - Number(request.roundOff ?? 0))
      )
    );
    const totalAmount = round(Number(request.totalAmount));

    if (request.sourceModule === "sales") {
      lines.push({
        amount: totalAmount,
        dc: "debit",
        ledgerId: party.id,
        narration: request.sourceDocumentNo
      });
      lines.push({
        amount: taxableAmount,
        dc: "credit",
        ledgerId: trade.id,
        narration: request.sourceDocumentNo
      });
      for (const taxLine of await this.outputTaxLines(
        databaseName,
        request.placeOfSupply ?? "cgst-sgst",
        taxAmount
      ))
        lines.push(taxLine);
    } else if (request.sourceModule === "purchase") {
      lines.push({
        amount: taxableAmount,
        dc: "debit",
        ledgerId: trade.id,
        narration: request.sourceDocumentNo
      });
      for (const taxLine of await this.inputTaxLines(
        databaseName,
        request.placeOfSupply ?? "cgst-sgst",
        taxAmount
      ))
        lines.push(taxLine);
      lines.push({
        amount: totalAmount,
        dc: "credit",
        ledgerId: party.id,
        narration: request.sourceDocumentNo
      });
    } else if (request.sourceModule === "receipt") {
      const cashOrBank = await this.requiredLedger(
        databaseName,
        request.cashOrBankLedgerCode || "CASH"
      );
      lines.push({
        amount: totalAmount,
        dc: "debit",
        ledgerId: cashOrBank.id,
        narration: request.sourceDocumentNo
      });
      lines.push({
        amount: totalAmount,
        dc: "credit",
        ledgerId: party.id,
        narration: request.sourceDocumentNo
      });
    } else if (request.sourceModule === "payment") {
      const cashOrBank = await this.requiredLedger(
        databaseName,
        request.cashOrBankLedgerCode || "CASH"
      );
      lines.push({
        amount: totalAmount,
        dc: "debit",
        ledgerId: party.id,
        narration: request.sourceDocumentNo
      });
      lines.push({
        amount: totalAmount,
        dc: "credit",
        ledgerId: cashOrBank.id,
        narration: request.sourceDocumentNo
      });
    } else if (request.sourceModule === "credit-note") {
      lines.push({
        amount: taxableAmount,
        dc: "debit",
        ledgerId: trade.id,
        narration: request.sourceDocumentNo
      });
      for (const taxLine of await this.outputTaxLines(
        databaseName,
        request.placeOfSupply ?? "cgst-sgst",
        taxAmount
      ))
        lines.push({ ...taxLine, dc: "debit" });
      lines.push({
        amount: totalAmount,
        dc: "credit",
        ledgerId: party.id,
        narration: request.sourceDocumentNo
      });
    } else if (request.sourceModule === "debit-note") {
      lines.push({
        amount: totalAmount,
        dc: "debit",
        ledgerId: party.id,
        narration: request.sourceDocumentNo
      });
      lines.push({
        amount: taxableAmount,
        dc: "credit",
        ledgerId: trade.id,
        narration: request.sourceDocumentNo
      });
      for (const taxLine of await this.outputTaxLines(
        databaseName,
        request.placeOfSupply ?? "cgst-sgst",
        taxAmount
      ))
        lines.push(taxLine);
    } else {
      throw new Error(`Posting source module is not implemented yet: ${request.sourceModule}`);
    }

    addBalancingRoundOff(lines, roundOff.id, request.sourceDocumentNo);

    return {
      lines,
      narration: `${request.sourceModule} posting from Billing ${request.sourceDocumentNo}`,
      sourceApp: request.sourceApp,
      sourceDocumentId: request.sourceDocumentId,
      sourceDocumentNo: request.sourceDocumentNo,
      sourceModule: request.sourceModule,
      sourceOperation: request.operation,
      status: "posted",
      voucherDate: request.documentDate,
      voucherType: voucherTypeFromSource(request.sourceModule)
    };
  }

  private async partyLedger(databaseName: string, request: AccountsPostingRequest) {
    const supplierSide = request.sourceModule === "purchase" || request.sourceModule === "payment";
    const code = `${supplierSide ? "SUP" : "CUS"}_${request.partyLedgerName
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .slice(0, 40)}`;
    const existing = await this.ledgers.findByCode(databaseName, code);
    if (existing) return existing;
    const groups = await this.ledgers.groups(databaseName);
    const group = groups.find(
      (item) => item.code === (supplierSide ? "SUNDRY_CREDITORS" : "SUNDRY_DEBTORS")
    );
    if (!group) throw new Error("Party ledger group is missing.");
    const created = await this.ledgers.create(databaseName, {
      classification: supplierSide ? "supplier" : "customer",
      code,
      groupId: group.id,
      name: request.partyLedgerName,
      status: "active",
      tallyLedgerName: request.partyLedgerName
    });
    if (!created) throw new Error("Party ledger could not be created.");
    return created;
  }

  private async requiredLedger(databaseName: string, code: string): Promise<Ledger> {
    const ledger = await this.ledgers.findByCode(databaseName, code);
    if (!ledger) throw new Error(`System ledger missing: ${code}`);
    return ledger;
  }

  private async assertPeriodOpen(databaseName: string, date: string) {
    const settings = await this.settings.get(databaseName);
    const lockDate = settings.financialYear.lockDate;
    if (lockDate && date <= lockDate && !settings.financialYear.allowBackdatedPosting) {
      throw new Error(`Accounting period is locked up to ${lockDate}.`);
    }
    if (await this.repository.isPeriodLocked(databaseName, date)) {
      throw new Error(
        `Accounting period is locked for ${date}. Use an adjustment voucher in an open period.`
      );
    }
  }

  private async outputTaxLines(
    databaseName: string,
    placeOfSupply: "cgst-sgst" | "igst",
    taxAmount: number
  ) {
    if (!taxAmount) return [];
    if (placeOfSupply === "igst")
      return [
        {
          amount: taxAmount,
          dc: "credit" as const,
          ledgerId: (await this.requiredLedger(databaseName, "OUTPUT_IGST")).id,
          narration: "Output IGST"
        }
      ];
    return [
      {
        amount: round(taxAmount / 2),
        dc: "credit" as const,
        ledgerId: (await this.requiredLedger(databaseName, "OUTPUT_CGST")).id,
        narration: "Output CGST"
      },
      {
        amount: round(taxAmount / 2),
        dc: "credit" as const,
        ledgerId: (await this.requiredLedger(databaseName, "OUTPUT_SGST")).id,
        narration: "Output SGST"
      }
    ];
  }

  private async inputTaxLines(
    databaseName: string,
    placeOfSupply: "cgst-sgst" | "igst",
    taxAmount: number
  ) {
    if (!taxAmount) return [];
    if (placeOfSupply === "igst")
      return [
        {
          amount: taxAmount,
          dc: "debit" as const,
          ledgerId: (await this.requiredLedger(databaseName, "INPUT_IGST")).id,
          narration: "Input IGST"
        }
      ];
    return [
      {
        amount: round(taxAmount / 2),
        dc: "debit" as const,
        ledgerId: (await this.requiredLedger(databaseName, "INPUT_CGST")).id,
        narration: "Input CGST"
      },
      {
        amount: round(taxAmount / 2),
        dc: "debit" as const,
        ledgerId: (await this.requiredLedger(databaseName, "INPUT_SGST")).id,
        narration: "Input SGST"
      }
    ];
  }
}

function totalsFor(lines: VoucherLineInput[]) {
  return {
    credit: round(
      lines
        .filter((line) => line.dc === "credit")
        .reduce((sum, line) => sum + Number(line.amount || 0), 0)
    ),
    debit: round(
      lines
        .filter((line) => line.dc === "debit")
        .reduce((sum, line) => sum + Number(line.amount || 0), 0)
    )
  };
}

function assertBalanced(totals: { credit: number; debit: number }) {
  if (totals.credit <= 0 || totals.debit <= 0)
    throw new Error("Voucher must contain debit and credit lines.");
  if (Math.abs(totals.credit - totals.debit) > 0.01) throw new Error("Voucher is not balanced.");
}

function addBalancingRoundOff(lines: VoucherLineInput[], ledgerId: string, narration: string) {
  const totals = totalsFor(lines);
  const difference = round(totals.debit - totals.credit);
  if (Math.abs(difference) <= 0.009) return;
  lines.push({
    amount: Math.abs(difference),
    dc: difference > 0 ? "credit" : "debit",
    ledgerId,
    narration
  });
}

function voucherTypeFromSource(sourceModule: AccountsPostingRequest["sourceModule"]): VoucherType {
  if (sourceModule === "credit-note") return "credit_note";
  if (sourceModule === "debit-note") return "debit_note";
  return sourceModule;
}

function round(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
