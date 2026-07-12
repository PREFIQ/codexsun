import { AppError } from "@codexsun/framework/errors";
import { PincodeRepository } from "./pincode.repository.js";
import type {
  Pincode,
  PincodeListFilters,
  PincodeSavePayload,
  PincodeStatus
} from "./pincode.types.js";

export class PincodeService {
  constructor(private readonly repository = new PincodeRepository()) {}

  list(filters: PincodeListFilters = {}) {
    return this.repository.list(filters);
  }
  listWithRelations(filters: PincodeListFilters = {}) {
    return this.repository.listWithRelations(filters);
  }
  get(id: string) {
    return this.repository.find(id);
  }
  getWithRelations(id: string) {
    return this.repository.findWithRelations(id);
  }

  async create(input: PincodeSavePayload) {
    const normalized = normalize(input);
    await this.requireCity(normalized.cityId);
    return this.save(() => this.repository.create(normalized));
  }

  async update(id: string, input: PincodeSavePayload) {
    const pincode = await this.mutable(id);
    const normalized = normalize(input);
    await this.requireCity(normalized.cityId);
    return this.save(() => this.repository.update(pincode.id, normalized));
  }

  async setStatus(id: string, status: PincodeStatus) {
    const pincode = await this.mutable(id);
    return this.repository.setStatus(pincode.id, status);
  }

  async forceDelete(id: string) {
    const pincode = await this.mutable(id);
    return this.repository.forceDelete(pincode.id);
  }

  private async mutable(id: string): Promise<Pincode> {
    const pincode = await this.repository.find(id);
    if (!pincode) throw AppError.notFound("Pincode was not found.");
    return pincode;
  }

  private async requireCity(cityId: string) {
    if (!(await this.repository.cityExists(cityId))) throw AppError.notFound("City was not found.");
  }

  private async save<T>(work: () => Promise<T>) {
    try {
      return await work();
    } catch (error) {
      if (isDuplicate(error)) throw AppError.conflict("Pincode name already exists for this city.");
      throw error;
    }
  }
}

function normalize(input: PincodeSavePayload): PincodeSavePayload {
  return {
    cityId: String(Number(input.cityId)),
    name: input.name.trim(),
    sortOrder: Number.isFinite(input.sortOrder) ? Number(input.sortOrder) : 1000,
    status: input.status === "inactive" ? "inactive" : "active"
  };
}

function isDuplicate(error: unknown): error is { code: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "ER_DUP_ENTRY"
  );
}
