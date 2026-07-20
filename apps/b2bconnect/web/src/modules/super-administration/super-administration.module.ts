export const superAdministrationModule = {
  capabilityExemptions: ["crud", "form", "list", "persistence"] as const,
  key: "b2bconnect.super-administration",
  register() {
    return { label: "Super Administration" } as const;
  }
};
