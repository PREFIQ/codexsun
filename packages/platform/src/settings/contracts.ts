export type SettingScope = "platform" | "staff" | "tenant";

export type SettingRecord = {
  key: string;
  scope: SettingScope;
  tenantId?: string | undefined;
  namespace: string;
  value: unknown;
  schemaVersion: number;
  isSecret: boolean;
  updatedBy: string;
  updatedAt: string;
};

export type FeatureFlag = {
  featureKey: string;
  label: string;
  description: string;
  enabled: boolean;
  tenantId?: string | undefined;
  reason?: string | undefined;
  updatedBy: string;
  updatedAt: string;
};

export type ConsoleSettingSection = {
  title: string;
  items: Array<{ label: string; key: string; value: unknown; masked?: boolean }>;
};
