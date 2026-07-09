import { AccountsSettingsRepository } from "./settings.repository.js";
import { defaultAccountsSettings, type AccountsSettings } from "./settings.types.js";

export class AccountsSettingsService {
  constructor(private readonly repository = new AccountsSettingsRepository()) {}

  get(databaseName: string) {
    return this.repository.get(databaseName);
  }

  save(databaseName: string, input: AccountsSettings) {
    return this.repository.save(databaseName, normalize(input));
  }
}

function normalize(input: AccountsSettings): AccountsSettings {
  return {
    financialYear: {
      ...defaultAccountsSettings.financialYear,
      ...input.financialYear,
      endDate: input.financialYear.endDate.trim(),
      lockDate: input.financialYear.lockDate?.trim() || null,
      startDate: input.financialYear.startDate.trim()
    },
    postingRules: {
      ...defaultAccountsSettings.postingRules,
      ...input.postingRules,
      roundOffLedgerCode: input.postingRules.roundOffLedgerCode.trim().toUpperCase()
    },
    tallyIntegration: {
      ...defaultAccountsSettings.tallyIntegration,
      ...input.tallyIntegration,
      companyName: input.tallyIntegration.companyName.trim(),
      tallyUrl: input.tallyIntegration.tallyUrl.trim()
    },
    voucherNumbering: {
      ...defaultAccountsSettings.voucherNumbering,
      ...input.voucherNumbering,
      creditNotePrefix: input.voucherNumbering.creditNotePrefix.trim().toUpperCase(),
      debitNotePrefix: input.voucherNumbering.debitNotePrefix.trim().toUpperCase(),
      journalPrefix: input.voucherNumbering.journalPrefix.trim().toUpperCase(),
      paymentPrefix: input.voucherNumbering.paymentPrefix.trim().toUpperCase(),
      receiptPrefix: input.voucherNumbering.receiptPrefix.trim().toUpperCase(),
      salesPrefix: input.voucherNumbering.salesPrefix.trim().toUpperCase()
    }
  };
}
