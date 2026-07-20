export type NetworkBlueprint = {
  associations: Array<{ code: string; description: string; name: string }>;
  capabilities: Array<{ description: string; key: string; name: string; stage: "active" | "next" }>;
  formula: string[];
  positioning: { primary: string; secondary: string; reject: string[] };
  roles: Array<{ responsibilities: string[]; role: "super_admin" | "admin" | "client" }>;
  whatsapp: Array<{ description: string; name: string }>;
};
