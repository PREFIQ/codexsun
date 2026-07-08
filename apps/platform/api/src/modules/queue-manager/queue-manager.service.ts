import { PlatformActivityService } from "../platform-activity/index.js";
import { processDatabaseMaintenanceJob } from "../database-maintenance/database-maintenance.worker.js";
import { QueueManagerRepository } from "./queue-manager.repository.js";
import type { QueueJobPayload } from "./queue-manager.types.js";

export class QueueManagerService {
  constructor(
    private readonly repository = new QueueManagerRepository(),
    private readonly activity = new PlatformActivityService()
  ) {}

  listJobs() {
    return this.repository.list();
  }

  runtimeSettings() {
    return this.repository.settings();
  }

  enqueue(input: QueueJobPayload) {
    return this.repository.enqueue(input);
  }

  async runJob(id: number) {
    const job = await this.repository.find(id);
    if (!job) return null;
    if (job.status !== "pending" && job.status !== "failed") {
      return job;
    }

    await this.repository.markRunning(id);
    try {
      const result = await this.dispatch(job.jobName, job.payload);
      const completed = await this.repository.markCompleted(id, result);
      await this.activity.recordActivity({
        action: "queue.job.completed",
        details: { jobName: job.jobName, queueName: job.queueName },
        moduleKey: "platform.queue-manager",
        recordId: job.id,
        recordLabel: job.jobName,
        recordUuid: job.uuid
      });
      return completed;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Queue job failed.";
      const failed = await this.repository.markFailed(id, message);
      await this.activity.recordActivity({
        action: "queue.job.failed",
        details: { error: message, jobName: job.jobName, queueName: job.queueName },
        moduleKey: "platform.queue-manager",
        recordId: job.id,
        recordLabel: job.jobName,
        recordUuid: job.uuid
      });
      return failed;
    }
  }

  async retryJob(id: number) {
    const job = await this.repository.retry(id);
    if (!job) return null;
    await this.activity.recordActivity({ action: "queue.job.retried", moduleKey: "platform.queue-manager", recordId: job.id, recordLabel: job.jobName, recordUuid: job.uuid });
    return job;
  }

  async cancelJob(id: number) {
    const job = await this.repository.cancel(id);
    if (!job) return null;
    await this.activity.recordActivity({ action: "queue.job.cancelled", moduleKey: "platform.queue-manager", recordId: job.id, recordLabel: job.jobName, recordUuid: job.uuid });
    return job;
  }

  private dispatch(jobName: string, payload: Record<string, unknown>) {
    if (jobName === "database-maintenance.run") {
      return processDatabaseMaintenanceJob(payload);
    }
    throw new Error(`No queue worker registered for ${jobName}.`);
  }
}
