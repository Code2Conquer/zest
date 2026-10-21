import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { NAV_GROUPS, navItems } from "@/lib/nav";

/** Every page under app/app, as a route. */
function appRoutes(dir = "app/app", base = "/app"): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory() && !name.startsWith("[")) out.push(...appRoutes(p, `${base}/${name}`));
    else if (name === "page.tsx") out.push(base);
  }
  return out;
}

describe("sidebar", () => {
  it("lists every app page exactly once", () => {
    const hrefs = navItems().map((i) => i.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect([...hrefs].sort()).toEqual(appRoutes().sort());
  });

  it("labels every item and group in English and Hindi", () => {
    for (const g of NAV_GROUPS) {
      if (g.label) expect(g.label.en && g.label.hi).toBeTruthy();
      for (const i of g.items) expect(i.label.en && i.label.hi && i.hint.en && i.hint.hi).toBeTruthy();
    }
  });

  it("opens with Today and ends with Settings", () => {
    const items = navItems();
    expect(items[0].href).toBe("/app");
    expect(items.at(-1)!.href).toBe("/app/connections");
  });
});
