// Renders the Zest Soundbox stills from render.html into public/soundbox/*.webp.
//   CHROME_PATH=<chrome binary> node scripts/soundbox/render.mjs
// Needs playwright-core (npx -y -p playwright-core@1.56.1 ...) and the repo's sharp (installed with next).
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const require = createRequire(join(root, "package.json"));
const sharp = require("sharp");
const { chromium } = await import(process.env.PLAYWRIGHT_CORE ?? "playwright-core");

// The four looks the site needs: off, amber (new order, speaking, printing), green (accepted), red (missed).
const STATES = {
  idle: { light: [1.0, 0.55, 0.12], intensity: 0.0 },
  amber: { light: [1.0, 0.42, 0.04], intensity: 1.0 },
  green: { light: [0.12, 0.85, 0.38], intensity: 0.95 },
  red: { light: [1.0, 0.16, 0.08], intensity: 1.0 },
};
const W = 2240, H = 1400, OUT_W = 640; // rendered at 3.5x, saved at 640 x 400 (16:10)

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage();
await page.goto("file://" + join(here, "render.html"));
mkdirSync(join(root, "public/soundbox"), { recursive: true });
for (const [name, s] of Object.entries(STATES)) {
  const url = await page.evaluate((o) => window.render(o), { w: W, h: H, ...s });
  const png = Buffer.from(url.split(",")[1], "base64");
  if (process.env.KEEP_PNG) writeFileSync(join(here, `${name}.png`), png);
  await sharp(png).resize({ width: OUT_W, kernel: "lanczos3" }).webp({ quality: 86, alphaQuality: 90 }).toFile(join(root, `public/soundbox/${name}.webp`));
  console.log("rendered", name);
}
await browser.close();
