import type { MasterTab } from "../master.workspace";
import type { MasterRecord } from "../master.types";

export const productTabs = ["details", "stock", "settings"] as const satisfies readonly MasterTab[];

export function nextProductCode(records: MasterRecord[]) {
  const next = records.reduce((highest, record) => {
    const match = /^P-(\d+)$/i.exec(record.code.trim());
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0) + 1;
  return `P-${String(next).padStart(4, "0")}`;
}
