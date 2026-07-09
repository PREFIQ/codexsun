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

  create(tenantId: string, input: LocationSavePayload) {
    return this.repository.create(tenantId, this.normalize(input));
  }

  update(tenantId: string, id: string, input: LocationSavePayload) {
    return this.repository.update(tenantId, id, this.normalize(input));
  }

  activate(tenantId: string, id: string) {
    return this.repository.setStatus(tenantId, id, "active");
  }

  deactivate(tenantId: string, id: string) {
    return this.repository.setStatus(tenantId, id, "inactive");
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

