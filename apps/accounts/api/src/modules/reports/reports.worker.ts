import { ReportsService } from "./reports.service.js";

export const reportsJobNames = {
  warmOverview: "accounts.reports.warm-overview"
} as const;

export async function processReportsJob(databaseName: string, job: { name: string }) {
  if (job.name !== reportsJobNames.warmOverview)
    throw new Error(`Unsupported reports job: ${job.name}`);
  const overview = await new ReportsService().overview(databaseName);
  return { generatedAt: new Date().toISOString(), overview };
}
