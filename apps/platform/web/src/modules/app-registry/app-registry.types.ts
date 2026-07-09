export type PlatformApp = { alwaysEnabled: boolean; appId: string; defaultLanding: boolean; description: string; id: number; label: string; moduleKey: string; stack: "platform" | "billing" | "accounts"; uuid: string };
export type PlatformAppSavePayload = Omit<PlatformApp, "id" | "uuid">;
