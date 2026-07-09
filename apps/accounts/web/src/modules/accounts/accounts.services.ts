export function accountsModuleSummary() {
  return { balancedPostingRequired: true, moduleKey: "accounts.ledgers", tallyReady: true } as const;
}
