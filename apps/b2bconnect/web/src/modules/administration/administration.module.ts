export const administrationModule = {
  capabilityExemptions: ["crud", "form", "list", "persistence"] as const,
  key: "b2bconnect.administration",
  register() {
    return { label: "Administration" } as const;
  }
};
