export const dataBridgeExecutionPolicy = Object.freeze({
  conflictDefault: "block" as const,
  existingTargetRecord: Object.freeze({
    action: "stop-table" as const,
    allowAutomaticInsert: false,
    allowAutomaticOverwrite: false,
    decisions: ["override", "reject"] as const,
    requireActor: true,
    requireReason: true,
    requireTimestamp: true,
    requirePerRecordDecision: true,
    requireAuditEntry: true
  }),
  resumeRequirements: Object.freeze({
    allConflictsDecided: true,
    planStillApproved: true,
    planChecksumUnchanged: true
  })
});

export type DataBridgeConflictDecision = {
  action: "override" | "reject";
  actor: string;
  conflictId: string;
  decidedAt: string;
  reason: string;
  sourceRecordRef: string;
  targetRecordRef: string;
};

export function validateConflictDecision(input: Partial<DataBridgeConflictDecision>) {
  if (input.action !== "override" && input.action !== "reject") return "Choose Override or Reject.";
  if (!input.conflictId?.trim()) return "Conflict reference is required.";
  if (!input.actor?.trim()) return "Decision actor is required.";
  if (!input.reason?.trim()) return "Decision reason is required.";
  if (!input.decidedAt?.trim()) return "Decision timestamp is required.";
  if (!input.sourceRecordRef?.trim() || !input.targetRecordRef?.trim()) return "Source and Target record references are required.";
  return null;
}
