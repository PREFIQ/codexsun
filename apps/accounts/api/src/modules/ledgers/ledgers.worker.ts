import { LedgersRepository } from "./ledgers.repository.js";

export const ledgerJobNames = {
  recalculateBalances: "accounts.ledgers.recalculate-balances"
} as const;

export async function processLedgerJob(databaseName: string, job: { name: string }) {
  if (job.name !== ledgerJobNames.recalculateBalances) {
    throw new Error(`Unsupported ledger job: ${job.name}`);
  }
  await new LedgersRepository().recalculateAll(databaseName);
  return { processed: true, recalculatedAt: new Date().toISOString() };
}
