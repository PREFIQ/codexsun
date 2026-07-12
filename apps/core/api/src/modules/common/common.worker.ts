export const commonWorker = {
  jobNames: ["core.common.location.reindex"],
  process(jobName: string) {
    return {
      jobName,
      processed: jobName === "core.common.location.reindex"
    };
  }
};
