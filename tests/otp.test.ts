import { describe, expect, it } from "vitest";
import { startOtp, verifyOtp } from "@/lib/server/otp";

describe("sign-in by mobile", () => {
  it("signs in with the right code, once", async () => {
    const r = await startOtp("98765 43210", "1.1.1.1");
    expect(r.devCode).toMatch(/^\d{6}$/);
    const wrong = r.devCode === "000000" ? "111111" : "000000";
    await expect(verifyOtp("9876543210", wrong)).rejects.toMatchObject({ status: 400 });
    await expect(verifyOtp("+91 98765 43210", r.devCode!)).resolves.toMatchObject({ signedIn: true, hasRestaurant: false });
    await expect(verifyOtp("9876543210", r.devCode!)).rejects.toMatchObject({ status: 400 });
  });
  it("refuses numbers that aren't Indian mobiles", async () => {
    await expect(startOtp("12345", "1.1.1.2")).rejects.toMatchObject({ status: 400 });
  });
});
