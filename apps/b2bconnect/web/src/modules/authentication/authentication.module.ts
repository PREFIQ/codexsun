export const authenticationModule = {
  capabilityExemptions: ["crud", "list", "persistence"] as const,
  key: "b2bconnect.authentication",
  register() {
    return { label: "Authentication" } as const;
  }
};
