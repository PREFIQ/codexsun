import { AppError } from "@codexsun/framework/errors";
import type { LocationDefinition, LocationListFilters, LocationSavePayload } from "./location.types.js";
import { LocationRepository } from "./location.repository.js";

export class LocationService {
  constructor(
    private readonly definition: LocationDefinition,
    private readonly repository = new LocationRepository(definition)
  ) {}

  list(tenantId: string, filters: LocationListFilters = {}) {
    return this.repository.list(tenantId, filters);
  }

  get(tenantId: string, id: string) {
    return this.repository.find(tenantId, id);
  }

  async create(tenantId: string, input: LocationSavePayload) {
    try {
      return await this.repository.create(tenantId, this.normalize(input));
    } catch (error) {
      throw locationSaveError(error, this.definition.label);
    }
  }

  async update(tenantId: string, id: string, input: LocationSavePayload) {
    try {
      return await this.repository.update(tenantId, id, this.normalize(input));
    } catch (error) {
      throw locationSaveError(error, this.definition.label);
    }
  }

  activate(tenantId: string, id: string) {
    return this.repository.setStatus(tenantId, id, "active");
  }

  deactivate(tenantId: string, id: string) {
    return this.repository.setStatus(tenantId, id, "inactive");
  }

  async forceDelete(tenantId: string, id: string) {
    const existing = await this.repository.find(tenantId, id);
    if (!this.repository.canMutate(existing, tenantId) || !existing) return null;
    const dependents = await this.repository.findDependents(existing.tenantId, id);
    if (dependents.length > 0) {
      const summary = dependents.map(({ count, label }) => `${count} ${label}`).join(", ");
      throw AppError.conflict(
        `${this.definition.label} cannot be force deleted because it is referenced by ${summary}. Remove those references first.`,
        { dependents }
      );
    }
    return this.repository.forceDelete(tenantId, id);
  }

  private normalize(input: LocationSavePayload): LocationSavePayload {
    return {
      ...input,
      code: input.code.trim(),
      name: input.name.trim(),
      sortOrder: Number.isFinite(input.sortOrder) ? Number(input.sortOrder) : 1000,
      status: input.status === "inactive" ? "inactive" : "active"
    };
  }
}

function locationSaveError(error: unknown, label: string) {
  if (!isDuplicateEntry(error)) return error;

  const duplicateKey = String(error.message ?? "").toLowerCase();
  if (duplicateKey.includes("tenant_code_unique") || duplicateKey.includes("primary")) {
    return AppError.conflict(`${label} code already exists. Enter a unique code.`, { field: "code" });
  }
  if (duplicateKey.includes("tenant_name_unique")) {
    return AppError.conflict(`${label} name already exists. Enter a unique name.`, { field: "name" });
  }
  return AppError.conflict(`${label} already exists. Enter unique details.`);
}

function isDuplicateEntry(error: unknown): error is { code: string; message?: string } {
  return typeof error === "object"
    && error !== null
    && "code" in error
    && (error as { code?: unknown }).code === "ER_DUP_ENTRY";
}

