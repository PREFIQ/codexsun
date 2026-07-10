export async function processOrganisationJob(job: { name: string; payload: unknown }) {
  if (!job.name.startsWith("core.organisation.")) return { processed: false };
  return { payload: job.payload, processed: true };
}
