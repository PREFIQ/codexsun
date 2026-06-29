import type { Migration } from "../migration-runner.js";

export const migration: Migration = {
  id: "004_master_settings_files_notifications",
  description: "Settings, feature flags, file metadata, notifications, and agent audit tables",
  up: async (db) => {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS platform_settings (
        \`key\` VARCHAR(120) NOT NULL,
        \`scope\` VARCHAR(30) NOT NULL,
        \`tenant_id\` VARCHAR(80) NULL,
        \`namespace\` VARCHAR(80) NOT NULL,
        \`value\` TEXT NULL,
        \`schema_version\` INT NOT NULL DEFAULT 1,
        \`is_secret\` TINYINT NOT NULL DEFAULT 0,
        \`updated_by\` VARCHAR(190) NOT NULL,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`key\`, \`scope\`, \`namespace\`),
        INDEX idx_settings_scope_tenant (\`scope\`, \`tenant_id\`)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS platform_feature_flags (
        feature_key VARCHAR(80) NOT NULL PRIMARY KEY,
        label VARCHAR(180) NOT NULL DEFAULT '',
        description TEXT NULL,
        enabled TINYINT NOT NULL DEFAULT 0,
        tenant_id VARCHAR(80) NULL,
        reason TEXT NULL,
        updated_by VARCHAR(190) NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_ff_tenant (tenant_id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS file_metadata (
        file_id VARCHAR(80) NOT NULL PRIMARY KEY,
        tenant_id VARCHAR(80) NOT NULL,
        owner_module VARCHAR(80) NOT NULL,
        owner_record_id VARCHAR(80) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        mime_type VARCHAR(120) NOT NULL,
        \`size\` BIGINT UNSIGNED NOT NULL DEFAULT 0,
        storage_key VARCHAR(255) NOT NULL,
        visibility VARCHAR(20) NOT NULL DEFAULT 'tenant',
        created_by VARCHAR(190) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_file_owner (tenant_id, owner_module, owner_record_id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS notification_records (
        notification_id VARCHAR(80) NOT NULL PRIMARY KEY,
        recipient_email VARCHAR(190) NOT NULL,
        tenant_id VARCHAR(80) NULL,
        \`module\` VARCHAR(80) NOT NULL,
        title VARCHAR(255) NOT NULL,
        body TEXT NULL,
        \`status\` VARCHAR(20) NOT NULL DEFAULT 'unread',
        priority VARCHAR(20) NOT NULL DEFAULT 'normal',
        action_href VARCHAR(500) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_notif_recipient (recipient_email, \`status\`)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS agent_action_audits (
        audit_id VARCHAR(80) NOT NULL PRIMARY KEY,
        agent_key VARCHAR(40) NOT NULL,
        user_email VARCHAR(190) NOT NULL,
        tenant_id VARCHAR(80) NULL,
        \`action\` VARCHAR(255) NOT NULL,
        tool_key VARCHAR(80) NOT NULL,
        input_summary TEXT NULL,
        output_summary TEXT NULL,
        confirmation_state VARCHAR(20) NOT NULL DEFAULT 'auto',
        correlation_id VARCHAR(80) NULL,
        \`timestamp\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_agent_audit_tenant (tenant_id, agent_key)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS activity_timeline (
        activity_id VARCHAR(80) NOT NULL PRIMARY KEY,
        tenant_id VARCHAR(80) NOT NULL,
        module_key VARCHAR(80) NOT NULL,
        record_type VARCHAR(80) NOT NULL,
        record_id VARCHAR(80) NOT NULL,
        actor_email VARCHAR(190) NOT NULL,
        activity_type VARCHAR(40) NOT NULL,
        message TEXT NOT NULL,
        payload JSON NULL,
        correlation_id VARCHAR(80) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_activity_record (tenant_id, module_key, record_type, record_id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS comments (
        comment_id VARCHAR(80) NOT NULL PRIMARY KEY,
        tenant_id VARCHAR(80) NOT NULL,
        module_key VARCHAR(80) NOT NULL,
        record_type VARCHAR(80) NOT NULL,
        record_id VARCHAR(80) NOT NULL,
        author_email VARCHAR(190) NOT NULL,
        body TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_comment_record (tenant_id, module_key, record_type, record_id)
      )
    `);
  }
};
