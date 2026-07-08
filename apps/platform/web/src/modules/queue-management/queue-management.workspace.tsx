import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { QueueManagementForm } from "./queue-management.form";
import { useQueueJobMutations, useQueueJobsQuery, useQueueRuntimeQuery } from "./queue-management.hooks";
import { QueueManagementList } from "./queue-management.list";

export function QueueManagementWorkspace() {
  const jobs = useQueueJobsQuery();
  const settings = useQueueRuntimeQuery();
  const mutations = useQueueJobMutations();
  const busy = mutations.cancel.isPending || mutations.retry.isPending || mutations.run.isPending;
  return (
    <WorkspacePage
      title="Queue Management"
      description="Manage database-backed platform jobs now, with the same surface ready for BullMQ and Redis later."
      technicalName="page.queue-management"
      actions={<QueueManagementForm loading={jobs.isLoading || settings.isLoading} onRefresh={() => { void jobs.refetch(); void settings.refetch(); }} />}
    >
      <QueueManagementList
        busy={busy}
        jobs={jobs.data ?? []}
        settings={settings.data}
        onCancel={(id) => mutations.cancel.mutate(id)}
        onRetry={(id) => mutations.retry.mutate(id)}
        onRun={(id) => mutations.run.mutate(id)}
      />
    </WorkspacePage>
  );
}
