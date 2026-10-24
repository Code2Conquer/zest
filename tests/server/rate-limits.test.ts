import { beforeEach, describe, expect, it } from "vitest";
import { POST as copilot } from "@/app/api/copilot/route";
import { POST as preview } from "@/app/api/listing/preview/route";
import { scrubEvent } from "@/sentry.server.config";
import { cookieJar } from "../cookies";
import { freshOutlet, signInAsOwner } from "../helpers";

const ctx = { params: Promise.resolve({}) };

describe("rate limits", () => {
  beforeEach(() => cookieJar.clear());

  it("allows 20 copilot messages a minute and refuses the 21st", async () => {
    const o = await freshOutlet();
    await signInAsOwner(o);
    const send = () => copilot(new Request("http://x/api/copilot", { method: "POST", body: JSON.stringify({ message: "How did we do yesterday?", lang: "en" }) }), ctx);
    for (let i = 0; i < 20; i++) expect((await send()).status).toBe(200);
    expect((await send()).status).toBe(429);
  });

  it("allows 10 listing previews an hour per address", async () => {
    const ip = `10.0.0.${Math.floor(Math.random() * 250)}`;
    const send = () => preview(new Request("http://x/api/listing/preview", { method: "POST", headers: { "x-forwarded-for": `${ip}, 1.1.1.1` }, body: JSON.stringify({ url: "not a link" }) }), ctx);
    for (let i = 0; i < 10; i++) expect((await send()).status).not.toBe(429);
    expect((await send()).status).toBe(429);
  });
});

describe("error reports", () => {
  it("scrubs phone numbers before sending to Sentry", () => {
    expect(scrubEvent({ message: "OTP for +919876543210 failed" }).message).toBe("OTP for [phone] failed");
  });
  it("drops request bodies", () => {
    expect(scrubEvent({ message: "x", request: { data: '{"phone":"9876543210"}', url: "/api/x" } }).request).toEqual({ url: "/api/x" });
  });
});
