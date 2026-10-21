// npm run eval: the golden conversations against Claude. Fails below 90% so prompt or model
// changes that break answers are caught. The same cases run on the keyword rules in `npm test`.

process.env.DATABASE_URL = ":memory:";
const PASS_MARK = 0.9;

async function main() {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    console.log("ANTHROPIC_API_KEY isn't set, so there is no Claude to evaluate. The keyword-rules cases run in `npm test`.");
    return;
  }
  const { ready } = await import("@/lib/server/db");
  await ready();
  const { AGENTS, loadCases, runCase } = await import("./cases");
  const results = [];
  for (const agent of AGENTS) {
    for (const c of loadCases(agent)) {
      const r = await runCase(c, "claude");
      results.push(r);
      console.log(`${r.pass ? "pass" : "FAIL"}  ${r.id.padEnd(12)} ${c.message}${r.pass ? "" : `\n      ${r.failures.join("\n      ")}\n      reply: ${r.reply.text}`}`);
    }
  }
  const passed = results.filter((r) => r.pass).length;
  const share = passed / results.length;
  console.log(`\n${passed}/${results.length} passed (${Math.round(share * 100)}%), pass mark ${PASS_MARK * 100}%`);
  if (share < PASS_MARK) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
