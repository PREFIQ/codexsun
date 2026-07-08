export type PlatformAppId = "application" | "billing";

export type PlatformAppDefinition = {
  alwaysEnabled: boolean;
  defaultLanding: boolean;
  description: string;
  id: PlatformAppId;
  label: string;
  moduleKey: string;
  stack: "platform" | "billing";
};
