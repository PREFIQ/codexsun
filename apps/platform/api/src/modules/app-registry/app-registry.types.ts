export type PlatformAppId = "application" | "billing" | "accounts" | "task-manager";

export type PlatformAppDefinition = {
  alwaysEnabled: boolean;
  defaultLanding: boolean;
  description: string;
  id: number;
  appId: PlatformAppId;
  label: string;
  moduleKey: string;
  stack: "platform" | "billing" | "accounts" | "platform-task-manager";
  uuid: string;
};

export type PlatformAppSavePayload = Omit<PlatformAppDefinition, "id" | "uuid">;
