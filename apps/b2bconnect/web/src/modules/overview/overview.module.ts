export const overviewModule = {
  capabilityExemptions: ["crud", "form", "list", "persistence"] as const,
  key: "b2bconnect.overview",
  register() {
    return { label: "Overview" } as const;
  }
};
