export function createOrganisationEvent(action: string, id: string) {
  return { action, id, module: "core.organisation" };
}
