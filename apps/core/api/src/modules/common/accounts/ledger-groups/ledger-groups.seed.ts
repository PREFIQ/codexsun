import { LedgerGroupsRepository } from "./ledger-groups.repository.js";
export async function seedLedgerGroups() {
  const repository = new LedgerGroupsRepository();
  if (!(await repository.findByName("General")))
    await repository.create({ name: "General", status: "active" });
}
