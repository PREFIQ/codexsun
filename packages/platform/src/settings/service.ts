import { AppError } from "@codexsun/framework/errors";
import type { SettingRecord, SettingScope, FeatureFlag, ConsoleSettingSection } from "./contracts.js";
import type { SettingsRepository } from "./repository.js";

export class SettingsService {
  constructor(private readonly repository: SettingsRepository) {}

  async getSettings(scope: string, namespace: string, tenantId?: string): Promise<SettingRecord[]> {
    return this.repository.getByNamespace(scope, namespace, tenantId);
  }

  async updateSetting(input: {
    key: string; scope: SettingScope; namespace: string; value: unknown;
    tenantId?: string; updatedBy: string; isSecret?: boolean;
  }): Promise<void> {
    const setting: SettingRecord = {
      key: input.key, scope: input.scope, namespace: input.namespace, value: input.value,
      schemaVersion: 1, isSecret: input.isSecret ?? false, updatedBy: input.updatedBy,
      updatedAt: new Date().toISOString(),
      ...(input.tenantId ? { tenantId: input.tenantId } : {})
    };
    await this.repository.update(setting);
  }

  async getFeatureFlags(tenantId?: string): Promise<FeatureFlag[]> {
    return this.repository.getFeatureFlags(tenantId);
  }

  async setFeatureFlag(flag: FeatureFlag): Promise<void> {
    if (!flag.featureKey) throw AppError.validation("featureKey is required");
    await this.repository.setFeatureFlag(flag);
  }

  async getPlatformSettingsSummary(): Promise<ConsoleSettingSection[]> {
    return [
      {
        title: "Environment / Runtime",
        items: [
          { label: "Node Version", key: "node_version", value: process.version },
          { label: "Platform", key: "platform", value: process.platform },
          { label: "NODE_ENV", key: "node_env", value: process.env.NODE_ENV || "development" }
        ]
      },
      {
        title: "Authentication",
        items: [
          { label: "Auth Mode", key: "auth_mode", value: "jwt" },
          { label: "JWT Enabled", key: "jwt_enabled", value: true }
        ]
      },
      {
        title: "Mail / Integration",
        items: [
          { label: "SMTP Host", key: "smtp_host", value: process.env.SMTP_HOST || "(not configured)" },
          { label: "SMTP Port", key: "smtp_port", value: process.env.SMTP_PORT || "(not configured)" }
        ]
      },
      {
        title: "System Defaults",
        items: [
          { label: "Default Tenant Status", key: "default_tenant_status", value: "active" },
          { label: "Session Timeout (min)", key: "session_timeout", value: 60 }
        ]
      },
      {
        title: "Support",
        items: [
          { label: "Support Email", key: "support_email", value: process.env.SUPPORT_EMAIL || "(not configured)" },
          { label: "Documentation URL", key: "docs_url", value: "https://opencode.ai" }
        ]
      }
    ];
  }
}
