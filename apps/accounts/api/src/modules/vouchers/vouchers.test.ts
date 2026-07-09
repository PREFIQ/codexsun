import { describe, expect, it } from "vitest";
import { canSyncVoucher } from "./vouchers.sync.js";
import { vouchersModule } from "./vouchers.module.js";

describe("accounts vouchers module contract", () => {
  it("declares the tenant scoped voucher module", () => {
    expect(vouchersModule.key).toBe("accounts.vouchers");
    expect(vouchersModule.scope).toBe("tenant");
  });

  it("allows posted sync only for balanced vouchers", () => {
    expect(canSyncVoucher({ status: "posted", totalCredit: 100, totalDebit: 100 })).toBe(true);
    expect(canSyncVoucher({ status: "posted", totalCredit: 99, totalDebit: 100 })).toBe(false);
  });
});
