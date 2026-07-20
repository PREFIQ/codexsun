export const clientPortalModule = {
  capabilityExemptions: ["crud", "form", "list", "persistence"] as const,
  key: "b2bconnect.client-portal",
  register() {
    return { label: "Client Portal" } as const;
  }
};
