import { afterEach, describe, expect, it, vi } from "vitest";
import { startOtp, verifyOtp } from "@/lib/server/otp";

describe("sign-in by mobile", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("signs in with the right 4-digit code, once", async () => {
    const r = await startOtp("98765 43210", "1.1.1.1");
    const code = "devCode" in r ? r.devCode : "";
    expect(code).toMatch(/^\d{4}$/);
    const wrong = code === "0000" ? "1111" : "0000";
    await expect(verifyOtp("9876543210", wrong)).rejects.toMatchObject({ status: 400 });
    await expect(verifyOtp("+91 98765 43210", code)).resolves.toMatchObject({ signedIn: true, hasRestaurant: false });
    await expect(verifyOtp("9876543210", code)).rejects.toMatchObject({ status: 400 });
  });

  it("refuses numbers that aren't Indian mobiles", async () => {
    await expect(startOtp("12345", "1.1.1.2")).rejects.toMatchObject({ status: 400 });
  });

  it("uses the last 4 digits on production until a sender is set up, and can be switched off", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    const r = await startOtp("98111 22334", "1.1.1.3");
    expect(r).toMatchObject({ mode: "last4" });
    expect("devCode" in r).toBe(false);
    await expect(verifyOtp("9811122334", "2334")).resolves.toMatchObject({ signedIn: true });
    vi.stubEnv("ZEST_LAST4_OTP", "off");
    await expect(startOtp("98111 22335", "1.1.1.4")).rejects.toMatchObject({ status: 503 });
  });
});
