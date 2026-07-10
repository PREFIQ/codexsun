import { describe, expect, it } from "vitest";
import { emptyReceipt } from "./receipt.types";
describe("receipt module", () => { it("starts as a draft with a receipt date", () => { const value = emptyReceipt(); expect(value.status).toBe("draft"); expect(value.receiptDate).toMatch(/^\d{4}-\d{2}-\d{2}$/); }); });
