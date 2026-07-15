export function reviewApprovalSyncDecision() {
  return { direction: "server-only", conflictPolicy: "immutable-review-wins", offline: false };
}
