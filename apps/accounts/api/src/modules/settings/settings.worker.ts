export type AccountsSettingsWorkerJob = {
  databaseName: string;
  name: "accounts-settings.sync" | "accounts-settings.tally-check";
};

export async function processAccountsSettingsJob(job: AccountsSettingsWorkerJob) {
  return {
    job,
    processed: true,
    processedAt: new Date().toISOString()
  };
}
