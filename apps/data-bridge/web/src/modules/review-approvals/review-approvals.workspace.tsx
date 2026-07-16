import { useEffect, useState } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { Checkbox } from "@codexsun/ui/components/checkbox";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspaceSelect } from "@codexsun/ui/workspace/select";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import {
  WorkspaceTableEmptyState,
  WorkspaceTableHeaderCell,
  WorkspaceTableLoadingState,
  WorkspaceTablePanel
} from "@codexsun/ui/workspace/table";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import {
  useReviewActions,
  useReviewApprovals,
  useReviewCandidates,
  useReviewRecordPreview
} from "./review-approvals.hooks";
import { ReviewPrepareForm, SendSelectedRecordsForm } from "./review-approvals.form";
import { ReviewApprovalsList } from "./review-approvals.list";
import type {
  ReviewApproval,
  ReviewRecordPreviewRow,
  SelectedRecordInput
} from "./review-approvals.types";

export function ReviewApprovalsWorkspace() {
  const reviews = useReviewApprovals();
  const candidates = useReviewCandidates();
  const actions = useReviewActions();
  const [selected, setSelected] = useState<ReviewApproval | null>(null);
  const [targetTable, setTargetTable] = useState("");
  const [selections, setSelections] = useState<Record<string, SelectedRecordInput>>({});
  const preview = useReviewRecordPreview(selected?.id ?? null, targetTable);

  useEffect(() => {
    setTargetTable(selected?.tables[0]?.targetTable ?? "");
    setSelections({});
  }, [selected?.id]);

  const prepare = (promise: Promise<ReviewApproval>) =>
    promise
      .then((record) => {
        setSelected(record);
        toast.success("Data review prepared");
      })
      .catch((error: Error) =>
        toast.error("Could not prepare data review", { description: error.message })
      );

  if (selected)
    return (
      <WorkspacePage
        title={`${selected.planName} · RV-${selected.id}`}
        description="Compare live Source and Target records, then send new or different Source data without overwriting Target records."
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={actions.refresh.isPending || preview.isFetching}
              onClick={() => {
                setSelections({});
                actions.refresh.mutate(selected.id, {
                  onSuccess: async (record) => {
                    setSelected(record);
                    await preview.refetch();
                    toast.success("Source and Target data refreshed");
                  },
                  onError: (error) =>
                    toast.error("Could not refresh database data", {
                      description: error.message
                    })
                });
              }}
            >
              <RefreshCw
                className={`size-4 ${actions.refresh.isPending || preview.isFetching ? "animate-spin" : ""}`}
              />
              {actions.refresh.isPending ? "Refreshing..." : "Refresh data"}
            </Button>
            <Button variant="outline" onClick={() => setSelected(null)}>
              <ArrowLeft className="size-4" />
              Back
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-3 rounded-md border bg-card p-4 sm:grid-cols-4">
            <Metric
              label="Readiness"
              value={
                <WorkspaceStatusBadge
                  label={selected.dryRunSucceeded ? "ready" : "blocked"}
                  tone={selected.dryRunSucceeded ? "success" : "danger"}
                />
              }
            />
            <Metric label="Source rows" value={selected.totalSourceRows} />
            <Metric label="Target rows" value={selected.totalTargetRows} />
            <Metric label="Selected" value={Object.keys(selections).length} />
          </div>

          <section className="rounded-md border bg-card p-4">
            <div className="max-w-xl">
              <p className="mb-2 text-sm font-medium">Table pair</p>
              <WorkspaceSelect
                value={targetTable}
                onValueChange={setTargetTable}
                placeholder="Select table pair"
                options={selected.tables.map((table) => ({
                  value: table.targetTable,
                  label: `${table.sourceTable} → ${table.targetTable}`
                }))}
              />
            </div>
          </section>

          {preview.error ? (
            <WorkspaceFormBanner title="Unable to load record comparison">
              {preview.error.message}
            </WorkspaceFormBanner>
          ) : null}

          <RecordComparisonTable
            rows={preview.data?.rows ?? []}
            sourceTable={preview.data?.sourceTable ?? "Source"}
            targetTable={preview.data?.targetTable ?? "Target"}
            loading={preview.isLoading}
            selections={selections}
            onToggle={(row, checked) => {
              const selectionKey = `${targetTable}:${row.key}`;
              setSelections((current) => {
                const next = { ...current };
                if (checked && row.targetIdentityMode)
                  next[selectionKey] = {
                    targetTable,
                    identityValues: row.identityValues,
                    targetIdentityMode: row.targetIdentityMode
                  };
                else delete next[selectionKey];
                return next;
              });
            }}
          />

          <SendSelectedRecordsForm
            reviewId={selected.id}
            selectionCount={Object.keys(selections).length}
            pending={actions.sendSelected.isPending}
            error={actions.sendSelected.error?.message}
            onSubmit={(input) =>
              actions.sendSelected.mutate(
                { ...input, selections: Object.values(selections) },
                {
                  onSuccess: (run) => {
                    setSelections({});
                    toast.success(`Selected records queued as EX-${run.id}`, {
                      description: "Execution Runs will show transfer progress and conflicts."
                    });
                  },
                  onError: (error) =>
                    toast.error("Could not queue selected records", {
                      description: error.message
                    })
                }
              )
            }
          />
        </div>
      </WorkspacePage>
    );

  return (
    <WorkspacePage
      title="Review & Approvals"
      description="Prepare a live Source-to-Target comparison, inspect records side by side, and select data for transfer."
    >
      <div className="space-y-4">
        <ReviewPrepareForm
          candidates={candidates.data ?? []}
          pending={actions.prepare.isPending}
          error={actions.prepare.error?.message}
          onSubmit={(input) => prepare(actions.prepare.mutateAsync(input))}
        />
        <ReviewApprovalsList
          records={reviews.data ?? []}
          loading={reviews.isLoading}
          onView={setSelected}
        />
      </div>
    </WorkspacePage>
  );
}

function RecordComparisonTable({
  rows,
  sourceTable,
  targetTable,
  loading,
  selections,
  onToggle
}: {
  rows: ReviewRecordPreviewRow[];
  sourceTable: string;
  targetTable: string;
  loading: boolean;
  selections: Record<string, SelectedRecordInput>;
  onToggle: (row: ReviewRecordPreviewRow, checked: boolean) => void;
}) {
  return (
    <WorkspaceTablePanel className="min-w-0">
      <div className="max-h-[38rem] overflow-auto">
        <table className="w-full min-w-[980px] table-fixed text-sm">
          <colgroup>
            <col className="w-[6%]" />
            <col className="w-[41%]" />
            <col className="w-[41%]" />
            <col className="w-[12%]" />
          </colgroup>
          <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur">
            <tr>
              <WorkspaceTableHeaderCell className="text-center">Select</WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell>{`Source — ${sourceTable}`}</WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell>{`Target — ${targetTable}`}</WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell className="text-center">Status</WorkspaceTableHeaderCell>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const selectionKey = `${targetTable}:${row.key}`;
              return (
                <tr className="border-b align-top last:border-0" key={row.key}>
                  <td className="px-3 py-4 text-center">
                    <Checkbox
                      checked={Boolean(selections[selectionKey])}
                      disabled={row.targetIdentityMode === null}
                      aria-label={`Select Source record ${row.key}`}
                      onCheckedChange={(checked) => onToggle(row, checked === true)}
                    />
                  </td>
                  <td className="border-l px-4 py-3">
                    <RecordValues values={row.sourceValues} />
                  </td>
                  <td className="border-l px-4 py-3">
                    {row.targetValues ? (
                      <RecordValues values={row.targetValues} />
                    ) : (
                      <p className="py-2 text-sm text-muted-foreground">
                        No matching Target record.
                      </p>
                    )}
                  </td>
                  <td className="border-l px-3 py-4 text-center">
                    <WorkspaceStatusBadge
                      label={statusLabel(row)}
                      tone={
                        row.status === "new"
                          ? "success"
                          : row.status === "different"
                            ? "warning"
                            : row.status === "match"
                              ? "neutral"
                              : "danger"
                      }
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!rows.length && loading ? <WorkspaceTableLoadingState /> : null}
      {!rows.length && !loading ? (
        <WorkspaceTableEmptyState>No records found for this table pair.</WorkspaceTableEmptyState>
      ) : null}
    </WorkspaceTablePanel>
  );
}

function statusLabel(row: ReviewRecordPreviewRow) {
  if (row.status === "different")
    return row.targetIdentityMode === "generate" ? "different · new id" : "different · blocked";
  return row.status;
}

function RecordValues({ values }: { values: Record<string, unknown> }) {
  return (
    <dl className="grid grid-cols-[minmax(8rem,0.4fr)_minmax(10rem,1fr)] gap-x-3 gap-y-1 text-xs">
      {Object.entries(values).map(([field, value]) => (
        <div className="contents" key={field}>
          <dt className="truncate font-mono text-muted-foreground" title={field}>
            {field}
          </dt>
          <dd className="break-words font-mono">{formatValue(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function formatValue(value: unknown) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
}
