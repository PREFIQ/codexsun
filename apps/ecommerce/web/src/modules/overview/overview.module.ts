export const overviewModule = {
  capabilityExemptions: ["crud", "form", "list", "persistence"] as const,
  key: "ecommerce.overview",
  register() {
    return { label: "Overview" } as const;
  }
};
