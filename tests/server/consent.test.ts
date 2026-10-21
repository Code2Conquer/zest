import { describe, expect, it } from "vitest";
import { hasConsent, isStopMessage, optOutAll, recordConsent } from "@/lib/server/consent";
import { freshOutlet } from "../helpers";

const base = async () => {
  const o = await freshOutlet();
  return { brandId: o.brandId!, phone: "98000 00001", purpose: "whatsapp_marketing" as const, granted: true, wording: "Send me offers on WhatsApp", source: "storefront", actor: "customer" };
};

describe("consent ledger", () => {
  it("is false with no record", async () => {
    const b = await base();
    expect(await hasConsent(b.brandId, "+919800000001", "whatsapp_marketing")).toBe(false);
  });

  it("latest record wins", async () => {
    const b = await base();
    await recordConsent(b);
    expect(await hasConsent(b.brandId, "+919800000001", "whatsapp_marketing")).toBe(true);
    await recordConsent({ ...b, granted: false });
    expect(await hasConsent(b.brandId, "+919800000001", "whatsapp_marketing")).toBe(false);
    await recordConsent(b);
    expect(await hasConsent(b.brandId, "+919800000001", "whatsapp_marketing")).toBe(true);
  });

  it("opt-out leaves transactional alone", async () => {
    const b = await base();
    await recordConsent(b);
    await recordConsent({ ...b, purpose: "whatsapp_transactional", wording: "Order updates on WhatsApp" });
    await optOutAll(b.brandId, b.phone, "whatsapp:STOP");
    expect(await hasConsent(b.brandId, b.phone, "whatsapp_marketing")).toBe(false);
    expect(await hasConsent(b.brandId, b.phone, "whatsapp_transactional")).toBe(true);
  });

  it("refuses a record without wording", async () => {
    const b = await base();
    await expect(recordConsent({ ...b, wording: "" })).rejects.toThrow();
  });

  it("keeps brands apart", async () => {
    const a = await base();
    const other = await base();
    await recordConsent(a);
    expect(await hasConsent(other.brandId, a.phone, "whatsapp_marketing")).toBe(false);
  });

  it("recognises stop words", () => {
    for (const s of ["STOP", " stop. ", "Unsubscribe", "बंद करो", "रुको"]) expect(isStopMessage(s)).toBe(true);
    expect(isStopMessage("stop the biryani")).toBe(false);
  });
});
