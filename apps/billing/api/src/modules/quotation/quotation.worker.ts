export type QuotationWorkerJob = {
  id: string;
  name: "quotation.confirmation-sync" | "quotation.accounts-preview";
};

export async function processQuotationJob(job: QuotationWorkerJob) {
  return {
    job,
    processed: true,
    processedAt: new Date().toISOString()
  };
}
