import { AppError } from "@codexsun/framework/errors";
import { superAdminSystemRoles, staffSystemRoles, tenantSystemRoles, type RoleDefinition } from "./contracts.js";
import type { PlatformUserType } from "../users/contracts.js";
import { platformPermissionsAll, userTypeHasPermission, type UserType } from "../permissions/contracts.js";

export type RoleRecord = {
  createdAt: string;
  description: string;
  id: string;
  isSystem: boolean;
  key: string;
  label: string;
  permissions: string[];
  updatedAt: string;
  userType: PlatformUserType;
};

export interface RoleRepository {
  list(): Promise<RoleRecord[]>;
  getById(id: string): Promise<RoleRecord | null>;
  getByKey(key: string): Promise<RoleRecord | null>;
  create(input: { description: string; key: string; label: string; permissions: string[]; userType: PlatformUserType }): Promise<string>;
  update(id: string, input: { description?: string; label?: string; permissions?: string[]; status?: string }): Promise<boolean>;
  updatePermissions(id: string, permissions: string[]): Promise<boolean>;
}

export class InMemoryRoleRepository implements RoleRepository {
  private roles = new Map<string, RoleRecord>();

  async list(): Promise<RoleRecord[]> {
    return Array.from(this.roles.values());
  }

  async getById(id: string): Promise<RoleRecord | null> {
    return this.roles.get(id) ?? null;
  }

  async getByKey(key: string): Promise<RoleRecord | null> {
    for (const role of this.roles.values()) {
      if (role.key === key) return role;
    }
    return null;
  }

  async create(input: { description: string; key: string; label: string; permissions: string[]; userType: PlatformUserType }): Promise<string> {
    const id = `role_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();
    this.roles.set(id, {
      id,
      key: input.key,
      label: input.label,
      description: input.description,
      userType: input.userType,
      isSystem: false,
      permissions: input.permissions,
      createdAt: now,
      updatedAt: now
    });
    return id;
  }

  async update(id: string, input: { description?: string; label?: string; permissions?: string[]; status?: string }): Promise<boolean> {
    const existing = this.roles.get(id);
    if (!existing) return false;
    this.roles.set(id, {
      ...existing,
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.label !== undefined ? { label: input.label } : {}),
      ...(input.permissions !== undefined ? { permissions: input.permissions } : {}),
      updatedAt: new Date().toISOString()
    });
    return true;
  }

  async updatePermissions(id: string, permissions: string[]): Promise<boolean> {
    const existing = this.roles.get(id);
    if (!existing) return false;
    this.roles.set(id, { ...existing, permissions, updatedAt: new Date().toISOString() });
    return true;
  }
}

export class RoleService {
  constructor(private readonly repository: RoleRepository) {}

  getAllSystemRoles(): RoleDefinition[] {
    return [...superAdminSystemRoles, ...staffSystemRoles, ...tenantSystemRoles];
  }

  async list(): Promise<RoleRecord[]> {
    return this.repository.list();
  }

  async getById(id: string): Promise<RoleRecord> {
    const role = await this.repository.getById(id);
    if (!role) throw AppError.notFound("Role not found");
    return role;
  }

  async getByKey(key: string): Promise<RoleRecord | null> {
    return this.repository.getByKey(key);
  }

  async create(input: { description: string; key: string; label: string; permissions: string[]; userType: PlatformUserType }): Promise<RoleRecord> {
    const id = await this.repository.create(input);
    return this.getById(id);
  }

  async update(id: string, input: { description?: string; label?: string; permissions?: string[]; status?: string }): Promise<RoleRecord> {
    const existing = await this.getById(id);
    if (existing.isSystem) throw AppError.forbidden("Cannot modify system roles");
    await this.repository.update(id, input);
    return this.getById(id);
  }

  async updatePermissions(id: string, permissions: string[]): Promise<RoleRecord> {
    const existing = await this.getById(id);
    if (existing.isSystem) throw AppError.forbidden("Cannot modify system role permissions");
    for (const perm of permissions) {
      if (!platformPermissionsAll.includes(perm as typeof platformPermissionsAll[number])) {
        throw AppError.validation(`Invalid permission: ${perm}`);
      }
    }
    await this.repository.updatePermissions(id, permissions);
    return this.getById(id);
  }

  getPermissionsMatrix(): Array<{ permission: string; roles: Record<string, boolean> }> {
    const allRoles = this.getAllSystemRoles();
    return platformPermissionsAll.map((permission) => {
      const roles: Record<string, boolean> = {};
      for (const role of allRoles) {
        const userType = role.userType as UserType;
        roles[role.key] = userTypeHasPermission(userType, permission);
      }
      return { permission, roles };
    });
  }
}
