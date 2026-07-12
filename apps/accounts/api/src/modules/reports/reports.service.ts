import { ReportsRepository } from "./reports.repository.js";

export class ReportsService {
  constructor(private readonly repository = new ReportsRepository()) {}

  async overview(databaseName: string) {
    const [trialBalance, outstanding, voucherRegister, gst, profitAndLoss, balanceSheet] =
      await Promise.all([
        this.repository.trialBalance(databaseName),
        this.repository.outstanding(databaseName),
        this.repository.voucherRegister(databaseName),
        this.repository.gstSummary(databaseName),
        this.repository.profitAndLoss(databaseName),
        this.repository.balanceSheet(databaseName)
      ]);
    return { balanceSheet, gst, outstanding, profitAndLoss, trialBalance, voucherRegister };
  }

  trialBalance(databaseName: string) {
    return this.repository.trialBalance(databaseName);
  }

  ledgerStatement(databaseName: string, ledgerId: string) {
    return this.repository.ledgerStatement(databaseName, ledgerId);
  }

  outstanding(databaseName: string) {
    return this.repository.outstanding(databaseName);
  }

  voucherRegister(databaseName: string) {
    return this.repository.voucherRegister(databaseName);
  }

  gstSummary(databaseName: string) {
    return this.repository.gstSummary(databaseName);
  }
}
