import { describe, expect, it } from "vitest";
import { normalizePhone } from "@/lib/phone";

describe("normalizePhone", () => {
  it("accepts the usual ways of writing an Indian mobile", () => {
    for (const s of ["9876543210", "98765 43210", "+91 98765-43210", "919876543210", "09876543210"]) expect(normalizePhone(s)).toBe("+919876543210");
  });
  it("refuses short, non-mobile and foreign numbers", () => {
    for (const s of ["12345", "5876543210", "+1 415 555 0100"]) expect(() => normalizePhone(s)).toThrow();
  });
});
