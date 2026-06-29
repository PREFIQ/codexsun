import type { SettingRecord, FeatureFlag } from "./contracts.js";

export interface SettingsRepository {
  getByNamespace(scope: string, namespace: string, tenantId?: string): Promise<SettingRecord[]>;
  update(setting: SettingRecord): Promise<void>;
  getFeatureFlags(tenantId?: string): Promise<FeatureFlag[]>;
  setFeatureFlag(flag: FeatureFlag): Promise<void>;
}

export class MasterDbSettingsRepository implements SettingsRepository {
  constructor(
    private readonly db: {
      execute<TResult = unknown>(sql: string, values?: unknown[]): Promise<[TResult, unknown]>;
    }
  ) {}

  async getByNamespace(scope: string, namespace: string, tenantId?: string): Promise<SettingRecord[]> {
    const values: unknown[] = [scope, namespace];
    let sql = "SELECT `key`, `scope`, `tenant_id`, `namespace`, `value`, `schema_version`, `is_secret`, `updated_by`, `updated_at` FROM platform_settings WHERE `scope` = ? AND `namespace` = ?";
    if (tenantId) { sql += " AND `tenant_id` = ?"; values.push(tenantId); }
    const [rows] = await this.db.execute<Array<Record<string, unknown>>>(sql, values);
    return rows.map((r) => ({
      key: String(r.key),
      scope: r.scope as SettingRecord["scope"],
      tenantId: r.tenant_id ? String(r.tenant_id) : undefined,
      namespace: String(r.namespace),
      value: typeof r.value === "string" ? safeJsonParse(r.value) : r.value,
      schemaVersion: Number(r.schema_version),
      isSecret: !!r.is_secret,
      updatedBy: String(r.updated_by),
      updatedAt: String(r.updated_at || new Date().toISOString())
    }));
  }

  async update(setting: SettingRecord): Promise<void> {
    await this.db.execute(
      "INSERT INTO platform_settings (`key`, `scope`, `tenant_id`, `namespace`, `value`, `schema_version`, `is_secret`, `updated_by`, `updated_at`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `schema_version` = VALUES(`schema_version`), `updated_by` = VALUES(`updated_by`), `updated_at` = NOW()",
      [setting.key, setting.scope, setting.tenantId || null, setting.namespace,
       typeof setting.value === "object" ? JSON.stringify(setting.value) : String(setting.value),
       setting.schemaVersion, setting.isSecret ? 1 : 0, setting.updatedBy]
    );
  }

  async getFeatureFlags(tenantId?: string): Promise<FeatureFlag[]> {
    const values: unknown[] = [];
    let sql = "SELECT feature_key, label, description, enabled, tenant_id, reason, updated_by, updated_at FROM platform_feature_flags";
    if (tenantId) { sql += " WHERE tenant_id = ?"; values.push(tenantId); }
    const [rows] = await this.db.execute<Array<Record<string, unknown>>>(sql, values);
    return rows.map((r) => ({
      featureKey: String(r.feature_key),
      label: String(r.label || ""),
      description: String(r.description || ""),
      enabled: !!r.enabled,
      tenantId: r.tenant_id ? String(r.tenant_id) : undefined,
      reason: r.reason ? String(r.reason) : undefined,
      updatedBy: String(r.updated_by),
      updatedAt: String(r.updated_at || new Date().toISOString())
    }));
  }

  async setFeatureFlag(flag: FeatureFlag): Promise<void> {
    await this.db.execute(
      `INSERT INTO platform_feature_flags (feature_key, label, description, enabled, tenant_id, reason, updated_by, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE enabled = VALUES(enabled), reason = VALUES(reason), updated_by = VALUES(updated_by), updated_at = NOW()`,
      [flag.featureKey, flag.label, flag.description, flag.enabled ? 1 : 0, flag.tenantId || null, flag.reason || null, flag.updatedBy]
    );
  }
}

function safeJsonParse(v: string): unknown {
  try { return JSON.parse(v); } catch { return v; }
}
