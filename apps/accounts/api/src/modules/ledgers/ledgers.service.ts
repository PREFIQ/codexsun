import { LedgersRepository } from "./ledgers.repository.js";
import type { LedgerClassification, LedgerSavePayload, LedgerStatus } from "./ledgers.types.js";

const classifications: LedgerClassification[] = ["bank", "cash", "customer", "discount", "gst_input", "gst_output", "purchase", "round_off", "sales", "supplier", "adjustment"];
const statuses: LedgerStatus[] = ["active", "inactive"];

export class LedgersService {
  constructor(private readonly repository = new LedgersRepository()) {}

  groups(databaseName: string) {
    return this.repository.groups(databaseName);
  }

  list(databaseName: string, search = "") {
    return this.repository.list(databaseName, search);
  }

  lookup(databaseName: string) {
    return this.repository.lookup(databaseName);
  }

  get(databaseName: string, id: string) {
    return this.repository.get(databaseName, id);
  }

  async create(databaseName: string, input: LedgerSavePayload) {
    const payload = this.normalize(input);
    await this.ensureUnique(databaseName, payload);
    return this.repository.create(databaseName, payload);
  }

  async update(databaseName: string, id: string, input: LedgerSavePayload) {
    const payload = this.normalize(input);
    return this.repository.update(databaseName, id, payload);
  }

  private normalize(input: LedgerSavePayload): LedgerSavePayload {
    const code = input.code.trim().toUpperCase().replace(/[^A-Z0-9_ -]+/g, "");
    const name = input.name.trim();
    if (!code) throw new Error("Ledger code is required.");
    if (!name) throw new Error("Ledger name is required.");
    if (!input.groupId) throw new Error("Ledger group is required.");
    if (!classifications.includes(input.classification)) throw new Error("Ledger classification is invalid.");
    if (!statuses.includes(input.status)) throw new Error("Ledger status is invalid.");
    return {
      classification: input.classification,
      code,
      groupId: input.groupId,
      name,
      openingBalance: Number(input.openingBalance ?? 0),
      status: input.status,
      tallyLedgerName: input.tallyLedgerName?.trim() || name
    };
  }

  private async ensureUnique(databaseName: string, payload: LedgerSavePayload) {
    const existing = await this.repository.findByCode(databaseName, payload.code);
    if (existing) throw new Error(`Ledger code already exists: ${payload.code}`);
  }
}
