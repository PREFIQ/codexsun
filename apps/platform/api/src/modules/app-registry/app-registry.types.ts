export type PlatformAppId = "application" | "billing";

export type PlatformAppDefinition = {
  alwaysEnabled: boolean;
  defaultLanding: boolean;
  description: string;
  id: number;
  appId: string;
  label: string;
  moduleKey: string;
  stack: "platform" | "billing";
  uuid: string;
};

export type PlatformAppSavePayload = Omit<PlatformAppDefinition, "id" | "uuid">;
