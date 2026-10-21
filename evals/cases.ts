import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { OUTLET } from "@/lib/data";
import type { Lang } from "@/lib/i18n";
import { runCopilot } from "@/lib/server/copilot";
import { db } from "@/lib/server/db";
import { brands, outlets, type ApprovalKind, type Outlet } from "@/lib/server/schema";
import { seedRestaurantData } from "@/lib/server/seed";
import type { CopilotCard, CopilotReply } from "@/lib/types";

// Golden copilot conversations: one JSON file per agent in evals/copilot/.

export const AGENTS = ["finance", "reviews", "menu", "orders", "growth"] as const;

export type EvalCase = {
  id: string;
  message: string;
  uiLang: Lang;
  expect: {
    agent: CopilotReply["agent"];
    replyLang: Lang;
    /** The kinds of drafts the reply creates, as a set; [] means none. */
    approvalKinds?: ApprovalKind[];
    /** The kinds of cards under the reply, as a set; [] means none. */
    cardTypes?: CopilotCard["type"][];
    /** Words the reply text must contain (any case). */
    mentions?: string[];
  };
};

export function loadCases(agent: (typeof AGENTS)[number]): EvalCase[] {
  return JSON.parse(readFileSync(fileURLToPath(new URL(`./copilot/${agent}.json`, import.meta.url)), "utf8")) as EvalCase[];
}

/** A fresh copy of the sample restaurant, so drafts from one case never show up in another. */
export async function freshDemoCopy(): Promise<Outlet> {
  const [brand] = await db.insert(brands).values({ name: OUTLET.name }).returning();
  const [outlet] = await db.insert(outlets).values({ brandId: brand.id, name: OUTLET.name, area: OUTLET.area, livePlatforms: ["zomato", "swiggy"], journey: "live" }).returning();
  await seedRestaurantData(outlet.id);
  return outlet;
}

const sameSet = <T>(a: T[], b: T[]) => new Set(a).size === new Set(b).size && a.every((x) => b.includes(x));
const DEVANAGARI = /[ऀ-ॿ]/;

export async function runCase(c: EvalCase, engine: CopilotReply["engine"]): Promise<{ id: string; pass: boolean; failures: string[]; reply: CopilotReply }> {
  const reply = await runCopilot(await freshDemoCopy(), c.message, c.uiLang, engine);
  const failures: string[] = [];
  const e = c.expect;
  if (reply.agent !== e.agent) failures.push(`agent: expected ${e.agent}, got ${reply.agent}`);
  const lang: Lang = DEVANAGARI.test(reply.text) ? "hi" : "en";
  if (lang !== e.replyLang) failures.push(`reply language: expected ${e.replyLang}, got ${lang}`);
  const kinds = reply.cards.flatMap((k) => (k.type === "approval" ? [k.approval.kind] : []));
  if (e.approvalKinds && !sameSet(kinds, e.approvalKinds)) failures.push(`drafts: expected [${e.approvalKinds}], got [${kinds}]`);
  const types = reply.cards.map((k) => k.type);
  if (e.cardTypes && !sameSet(types, e.cardTypes)) failures.push(`cards: expected [${e.cardTypes}], got [${types}]`);
  for (const m of e.mentions ?? []) if (!reply.text.toLowerCase().includes(m.toLowerCase())) failures.push(`reply doesn't mention "${m}"`);
  return { id: c.id, pass: failures.length === 0, failures, reply };
}
