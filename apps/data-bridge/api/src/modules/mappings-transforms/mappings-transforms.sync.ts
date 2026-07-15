export function mappingsTransformsSyncDecision() {
  return {
    direction: "server-only",
    offline: false,
    conflictPolicy: "latest-draft-until-approved"
  };
}
