export const reportsEvents = {
  viewed: "accounts.reports.viewed"
} as const;

export function createReportsEvent(reportKey: string) {
  return {
    name: reportsEvents.viewed,
    occurredAt: new Date().toISOString(),
    payload: { reportKey },
    version: 1
  };
}
