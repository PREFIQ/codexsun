export const networkBlueprintModule = {
  capabilityExemptions: ["crud", "form", "list", "persistence"] as const,
  key: "b2bconnect.network-blueprint",
  register() {
    return { label: "Industry OS Blueprint" } as const;
  }
};
