import { describe, expect, it } from "vitest";
import { AGENTS, loadCases, runCase } from "@/evals/cases";

const DEVANAGARI = /[ऀ-ॿ]/;
const HINGLISH = /\b(kyun|kyu|kitna|kitne|hafte|aaj|kal|paisa|paise|kya|hai|karo|kar do|band|batao|khatam)\b/i;

describe("copilot golden conversations", () => {
  for (const agent of AGENTS) {
    const cases = loadCases(agent);

    it(`${agent}: has at least 10 cases, 3 in Hindi and 3 in Hinglish`, () => {
      expect(cases.length).toBeGreaterThanOrEqual(10);
      expect(cases.filter((c) => DEVANAGARI.test(c.message)).length).toBeGreaterThanOrEqual(3);
      expect(cases.filter((c) => !DEVANAGARI.test(c.message) && HINGLISH.test(c.message)).length).toBeGreaterThanOrEqual(3);
    });

    for (const c of cases) {
      it(`${c.id}: ${c.message}`, async () => {
        const r = await runCase(c, "rules");
        expect(r.failures).toEqual([]);
      });
    }
  }
});
