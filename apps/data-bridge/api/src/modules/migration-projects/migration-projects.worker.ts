export async function processMigrationBatch(input: { approved: boolean; dryRunPassed: boolean }) {
  if (!input.approved || !input.dryRunPassed) throw new Error("Migration execution requires approval and a successful dry run.");
  return { processed: 0, status: "execution-disabled-in-scaffold" as const };
}
