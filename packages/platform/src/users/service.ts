import { AppError } from "@codexsun/framework/errors";
import { hashPassword } from "../auth/password.js";
import type { PlatformUser, PlatformUserStatus, PlatformUserType } from "./contracts.js";

export type MasterUserRow = {
  created_at?: Date | string;
  display_name: string;
  email: string;
  id: number | string;
  password_hash: string;
  status: string;
  updated_at?: Date | string;
};

export interface UserRepository {
  list(tableName: string): Promise<MasterUserRow[]>;
  getById(tableName: string, id: string): Promise<MasterUserRow | null>;
  findByEmail(tableName: string, email: string): Promise<MasterUserRow | null>;
  create(tableName: string, input: { displayName: string; email: string; password: string; status?: string }): Promise<string>;
  update(tableName: string, id: string, input: { displayName?: string; status?: string }): Promise<boolean>;
  delete(tableName: string, id: string): Promise<boolean>;
}

export class MasterDbUserRepository implements UserRepository {
  constructor(
    private readonly db: {
      execute<TResult = unknown>(sql: string, values?: unknown[]): Promise<[TResult, unknown]>;
    }
  ) {}

  async list(tableName: string): Promise<MasterUserRow[]> {
    const [rows] = await this.db.execute<MasterUserRow[]>(
      `SELECT id, display_name, email, status, created_at, updated_at FROM ${tableName} ORDER BY created_at DESC`
    );
    return rows;
  }

  async getById(tableName: string, id: string): Promise<MasterUserRow | null> {
    const [rows] = await this.db.execute<MasterUserRow[]>(
      `SELECT id, display_name, email, status, created_at, updated_at FROM ${tableName} WHERE id = ?`,
      [id]
    );
    return rows[0] ?? null;
  }

  async findByEmail(tableName: string, email: string): Promise<MasterUserRow | null> {
    const [rows] = await this.db.execute<MasterUserRow[]>(
      `SELECT id, display_name, email, status, created_at, updated_at FROM ${tableName} WHERE email = ? LIMIT 1`,
      [email]
    );
    return rows[0] ?? null;
  }

  async create(tableName: string, input: { displayName: string; email: string; password: string; status?: string }): Promise<string> {
    const hash = hashPassword(input.password);
    const [result] = await this.db.execute<{ insertId: number | string }>(
      `INSERT INTO ${tableName} (display_name, email, password_hash, status) VALUES (?, ?, ?, ?)`,
      [input.displayName, input.email, hash, input.status || "active"]
    );
    return String(result.insertId);
  }

  async update(tableName: string, id: string, input: { displayName?: string; status?: string }): Promise<boolean> {
    const updates: string[] = [];
    const values: unknown[] = [];
    if (input.displayName !== undefined) { updates.push("display_name = ?"); values.push(input.displayName); }
    if (input.status !== undefined) { updates.push("status = ?"); values.push(input.status); }
    if (updates.length === 0) return false;
    values.push(id);
    await this.db.execute(`UPDATE ${tableName} SET ${updates.join(", ")} WHERE id = ?`, values);
    return true;
  }

  async delete(tableName: string, id: string): Promise<boolean> {
    await this.db.execute(`UPDATE ${tableName} SET status = 'disabled' WHERE id = ?`, [id]);
    return true;
  }
}

export class UserService {
  private readonly tableMap: Record<string, string> = {
    super_admin: "super_admin_users",
    staff: "staff_users"
  };

  constructor(private readonly repository: UserRepository) {}

  async list(userType: PlatformUserType): Promise<PlatformUser[]> {
    const tableName = this.tableMap[userType];
    if (!tableName) return [];
    const rows = await this.repository.list(tableName);
    return rows.map((row) => ({
      id: String(row.id),
      displayName: row.display_name,
      email: row.email,
      status: row.status as PlatformUserStatus,
      userType
    }));
  }

  async getById(userType: PlatformUserType, id: string): Promise<PlatformUser | null> {
    const tableName = this.tableMap[userType];
    if (!tableName) return null;
    const row = await this.repository.getById(tableName, id);
    if (!row) return null;
    return {
      id: String(row.id),
      displayName: row.display_name,
      email: row.email,
      status: row.status as PlatformUserStatus,
      userType
    };
  }

  async create(input: { displayName: string; email: string; password: string; userType: PlatformUserType; status?: string }): Promise<PlatformUser> {
    const tableName = this.tableMap[input.userType];
    if (!tableName) throw AppError.validation(`Invalid user type: ${input.userType}`);

    const existing = await this.repository.findByEmail(tableName, input.email);
    if (existing) throw AppError.conflict("User with this email already exists");

    const id = await this.repository.create(tableName, {
      displayName: input.displayName,
      email: input.email,
      password: input.password,
      ...(input.status ? { status: input.status } : {})
    });

    return {
      id,
      displayName: input.displayName,
      email: input.email,
      status: (input.status || "active") as PlatformUserStatus,
      userType: input.userType
    };
  }

  async update(userType: PlatformUserType, id: string, input: { displayName?: string; status?: string }): Promise<PlatformUser> {
    const tableName = this.tableMap[userType];
    if (!tableName) throw AppError.validation(`Invalid user type: ${userType}`);

    const existing = await this.repository.getById(tableName, id);
    if (!existing) throw AppError.notFound("User not found");

    await this.repository.update(tableName, id, input);

    return {
      id,
      displayName: input.displayName ?? existing.display_name,
      email: existing.email,
      status: (input.status ?? existing.status) as PlatformUserStatus,
      userType
    };
  }

  async suspend(userType: PlatformUserType, id: string): Promise<void> {
    const tableName = this.tableMap[userType];
    if (!tableName) throw AppError.validation(`Invalid user type: ${userType}`);
    await this.repository.update(tableName, id, { status: "disabled" });
  }

  async activate(userType: PlatformUserType, id: string): Promise<void> {
    const tableName = this.tableMap[userType];
    if (!tableName) throw AppError.validation(`Invalid user type: ${userType}`);
    await this.repository.update(tableName, id, { status: "active" });
  }
}
