export const masterJobNames = {
  refreshSearchIndex: "core.master.refresh-search-index"
} as const;

export async function processMasterJob(job: { name: string; payload: unknown }) {
  if (job.name !== masterJobNames.refreshSearchIndex) return { processed: false };
  return { processed: true, payload: job.payload };
}
