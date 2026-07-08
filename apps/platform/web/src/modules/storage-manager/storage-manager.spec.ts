import { describe, expect, it } from "vitest";
import { cleanPath, fileSizeLabel } from "./storage-manager.schema";

describe("storage manager UI helpers", () => {
  it("cleans browser paths", () => {
    expect(cleanPath("logo/../images\\avatar.svg")).toBe("logo/images/avatar.svg");
  });

  it("formats readable file sizes", () => {
    expect(fileSizeLabel(1536)).toBe("1.5 KB");
  });
});
