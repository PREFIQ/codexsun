import type { Ledger } from "./ledgers.types.js";

export const ledgerEvents = {
  changed: "accounts.ledger.changed",
  balanceRecalculated: "accounts.ledger.balance-recalculated"
} as const;

export function createLedgerEvent(
  action: "created" | "updated" | "balance-recalculated",
  ledger: Ledger
) {
  return {
    name:
      action === "balance-recalculated" ? ledgerEvents.balanceRecalculated : ledgerEvents.changed,
    occurredAt: new Date().toISOString(),
    payload: {
      action,
      classification: ledger.classification,
      code: ledger.code,
      ledgerId: ledger.id,
      name: ledger.name
    },
    version: 1
  };
}
