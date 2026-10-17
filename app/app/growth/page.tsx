"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CalendarDays, Clock, Loader2, Megaphone, Pause, Play, Sparkles, Square, Star, Users, X } from "lucide-react";
import { ApprovalTicket } from "@/components/approval-ticket";
import { ChannelTag } from "@/components/bits";
import { rupees } from "@/components/cards";
import { api, useApi } from "@/lib/api";
import { CHANNEL_NAME } from "@/lib/platforms";
import { useApp, useOutlet } from "@/lib/state";
import type { ApprovalDTO, CampaignDTO, CampaignInput, EstimateDTO, GrowthDTO, GrowthGoal, SuggestionDTO } from "@/lib/types";

const GOALS: { id: GrowthGoal; en: string; hi: string; icon: typeof Star }[] = [
  { id: "new_customers", en: "New customers", hi: "नए ग्राहक", icon: Users },
  { id: "slow_hours", en: "Slow hours", hi: "धीमे घंटे", icon: Clock },
  { id: "bigger_orders", en: "Bigger orders", hi: "बड़े ऑर्डर", icon: Sparkles },
  { id: "dish", en: "Push a dish", hi: "एक डिश आगे", icon: Star },
  { id: "festival", en: "Festival", hi: "त्योहार", icon: CalendarDays },
];

const WINDOWS = ["All day", "12 to 3 pm (lunch)", "3 to 6 pm, Mon to Thu", "7 to 11 pm (dinner)", "Fri to Sun, all day"];

const STATUS: Record<CampaignDTO["status"], { en: string; hi: string; tone: string }> = {
  live: { en: "Live", hi: "चालू", tone: "bg-leaf-soft text-leaf" },
  paused: { en: "Paused", hi: "रुका", tone: "bg-chilli-soft text-chilli" },
  ended: { en: "Ended", hi: "ख़त्म", tone: "bg-sunken text-ink-2" },
};

const ret = (c: Pick<CampaignDTO, "revenue" | "spent">) => (c.spent ? c.revenue / c.spent : 0);

export default function Growth() {
  const { lang, outlet } = useApp();
  const { live } = useOutlet();
  const hi = lang === "hi";
  const { data, error, reload } = useApi<GrowthDTO>(outlet ? `/api/growth?o=${outlet.id}` : null);
  const [plan, setPlan] = useState<CampaignInput | null>(null);
  const [checking, setChecking] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const builder = useRef<HTMLDivElement>(null);

  function open(input: CampaignInput) {
    setPlan(live.includes(input.platform) ? input : { ...input, platform: live[0] });
    setTimeout(() => builder.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  async function check() {
    setChecking(true);
    setNote(null);
    try {
      const { changed } = await api<{ changed: { status: string; detail: string }[] }>("/api/growth/check", { method: "POST" });
      setNote(changed.length ? changed.map((c) => c.detail).join(" · ") : hi ? "सब ठीक है, कुछ बदला नहीं।" : "All campaigns are within their limits. Nothing changed.");
      await reload();
    } catch (e) {
      setNote((e as Error).message);
    } finally {
      setChecking(false);
    }
  }

  async function control(c: CampaignDTO, action: "pause" | "resume" | "end") {
    setNote(null);
    try {
      await api(`/api/growth/campaigns/${c.id}`, { method: "PATCH", json: { action } });
      await reload();
    } catch (e) {
      setNote((e as Error).message);
    }
  }

  const s = data?.summary;
  const blank: CampaignInput = { platform: live[0] ?? "zomato", goal: "new_customers", offer: "percent", value: 20, upTo: 80, minOrder: 0, budget: 2500, days: 7, window: "All day" };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[clamp(1.9rem,4vw,2.6rem)] font-semibold tracking-[-0.03em]">{hi ? "ग्रोथ" : "Growth"}</h1>
          <p className="mt-1 max-w-[62ch] text-muted">
            {hi
              ? "हर प्लेटफ़ॉर्म पर प्रोमो और ऐड, पक्की ख़र्च सीमा के साथ। आपकी मंज़ूरी के बाद ही चालू, और फ़ायदा न हो तो अपने-आप रुकते हैं।"
              : "Promos and ads on each platform, with a hard spend cap. Nothing runs without your OK, and campaigns pause themselves if they stop paying off."}
          </p>
        </div>
        <button type="button" onClick={() => open(blank)} className="rounded-full bg-ink px-5 py-2.5 font-medium text-paper">
          {hi ? "नया कैंपेन" : "New campaign"}
        </button>
      </div>

      {error && <p className="mt-6 rounded-lg bg-chilli-soft px-3 py-2 text-sm text-chilli">{error}</p>}

      {s && (
        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(
            [
              [hi ? "ख़र्च" : "Spent", rupees(s.spent)],
              [hi ? "कैंपेन से बिक्री" : "Sales from campaigns", rupees(s.revenue)],
              [hi ? "ऑर्डर" : "Orders", String(s.orders)],
              [hi ? "रिटर्न" : "Return on spend", s.spent ? `${(s.revenue / s.spent).toFixed(1)}×` : "—"],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-surface px-4 py-3 shadow-[0_0_0_1px_var(--line)]">
              <dt className="text-sm text-muted">{label}</dt>
              <dd className="mt-0.5 text-[1.35rem] font-semibold tracking-tight">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      {data && data.suggestions.length > 0 && (
        <section className="mt-10">
          <h2 className="font-medium">{hi ? "आगे क्या आज़माएँ" : "Worth trying next"}</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.suggestions.map((sg) => (
              <SuggestionCard key={sg.id} s={sg} onPlan={() => open(sg.input)} />
            ))}
          </ul>
        </section>
      )}

      <div ref={builder} className="scroll-mt-6">
        <AnimatePresence>{plan && <Builder key={JSON.stringify(plan)} initial={plan} limit={data?.limit ?? 10000} onClose={() => setPlan(null)} onDone={reload} />}</AnimatePresence>
      </div>

      {data && (
        <section className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-medium">
              {hi ? "कैंपेन" : "Campaigns"} <span className="text-muted">{s?.live ? `· ${s.live} ${hi ? "चालू" : "live"}` : ""}</span>
            </h2>
            <button type="button" onClick={check} disabled={checking} className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm shadow-[inset_0_0_0_1px_var(--line)] hover:bg-sunken disabled:opacity-50">
              {checking && <Loader2 aria-hidden className="size-3.5 animate-spin" />}
              {hi ? "अभी जाँचें" : "Check now"}
            </button>
          </div>
          {note && <p className="mt-2 text-sm text-ink-2">{note}</p>}
          {data.campaigns.length === 0 ? (
            <p className="mt-4 rounded-xl bg-sunken px-4 py-8 text-center text-muted">{hi ? "अभी कोई कैंपेन नहीं। ऊपर कोई सुझाव चुनें या नया कैंपेन बनाएँ।" : "No campaigns yet. Pick a suggestion above or plan a new one."}</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {data.campaigns.map((c) => (
                <CampaignRow key={c.id} c={c} onControl={(a) => control(c, a)} />
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

function SuggestionCard({ s, onPlan }: { s: SuggestionDTO; onPlan: () => void }) {
  const { pick, lang } = useApp();
  const goal = GOALS.find((g) => g.id === s.input.goal) ?? GOALS[0];
  return (
    <li className="flex flex-col rounded-2xl bg-surface p-4 shadow-[0_0_0_1px_var(--line)]">
      <span className="grid size-9 place-items-center rounded-full bg-turmeric-soft text-turmeric">
        <goal.icon aria-hidden className="size-4" />
      </span>
      <p className="mt-3 font-medium">{pick(s.title)}</p>
      <p className="mt-1 flex-1 text-sm leading-relaxed text-ink-2">{pick(s.why)}</p>
      <div className="mt-3 flex items-center justify-between">
        <ChannelTag channel={s.input.platform} />
        <button type="button" onClick={onPlan} className="rounded-full bg-ink px-3.5 py-1.5 text-sm font-medium text-paper">
          {lang === "hi" ? "प्लान करें" : "Plan this"}
        </button>
      </div>
    </li>
  );
}

function Builder({ initial, limit, onClose, onDone }: { initial: CampaignInput; limit: number; onClose: () => void; onDone: () => void }) {
  const { lang, pick } = useApp();
  const { live } = useOutlet();
  const hi = lang === "hi";
  const [i, setI] = useState<CampaignInput>(initial);
  const [est, setEst] = useState<EstimateDTO | null>(null);
  const [estError, setEstError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [ticket, setTicket] = useState<ApprovalDTO | null>(null);
  const set = <K extends keyof CampaignInput>(k: K, v: CampaignInput[K]) => setI((x) => ({ ...x, [k]: v }));

  // Re-estimate shortly after the owner stops changing the plan.
  useEffect(() => {
    const id = setTimeout(async () => {
      try {
        setEst(await api<EstimateDTO>("/api/growth/estimate", { method: "POST", json: i }));
        setEstError(null);
      } catch (e) {
        setEstError((e as Error).message);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [i]);

  async function send() {
    setSending(true);
    setEstError(null);
    try {
      setTicket(await api<ApprovalDTO>("/api/growth/propose", { method: "POST", json: i }));
    } catch (e) {
      setEstError((e as Error).message);
    } finally {
      setSending(false);
    }
  }

  const field = "w-full rounded-lg bg-surface px-3 py-2 outline-none shadow-[inset_0_0_0_1px_var(--line)] focus:shadow-[inset_0_0_0_2px_var(--turmeric)]";
  const chip = (on: boolean) => `rounded-full px-3.5 py-1.5 text-sm transition-shadow ${on ? "bg-ink text-paper" : "bg-surface shadow-[0_0_0_1px_var(--line)] hover:shadow-[0_0_0_1px_var(--ink-2)]"}`;
  const good = est && est.returnOnSpend >= 3;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      className="mt-10 overflow-hidden rounded-3xl bg-surface shadow-[0_0_0_1px_var(--line),0_30px_60px_-40px_rgba(0,0,0,0.4)]"
      aria-label={hi ? "कैंपेन प्लान" : "Plan a campaign"}
    >
      <div className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-6">
        <h2 className="flex items-center gap-2 text-lg font-medium">
          <Megaphone aria-hidden className="size-5 text-turmeric" />
          {hi ? "कैंपेन प्लान करें" : "Plan a campaign"}
        </h2>
        <button type="button" onClick={onClose} aria-label="Close" className="-mr-2 rounded-full p-2 text-muted hover:bg-sunken hover:text-ink">
          <X className="size-5" />
        </button>
      </div>

      {ticket ? (
        <div className="grid gap-6 p-5 sm:p-6 md:grid-cols-[1fr_1fr]">
          <div>
            <p className="font-medium">{hi ? "मंज़ूरी के लिए भेजा।" : "Sent for your approval."}</p>
            <p className="mt-1 text-sm text-ink-2">
              {hi
                ? "मंज़ूर करते ही यह प्लेटफ़ॉर्म पर चालू होगा और नीचे की सूची में दिखेगा। यह Today पर भी है।"
                : "Approving it starts it on the platform and adds it to your campaigns below. It's also waiting on Today."}
            </p>
          </div>
          <ApprovalTicket approval={ticket} onDone={() => onDone()} />
        </div>
      ) : (
        <div className="grid gap-8 p-5 sm:p-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-sm text-ink-2">{hi ? "लक्ष्य" : "Goal"}</p>
              <div className="flex flex-wrap gap-2">
                {GOALS.map((g) => (
                  <button key={g.id} type="button" onClick={() => set("goal", g.id)} className={chip(i.goal === g.id)}>
                    {pick(g)}
                  </button>
                ))}
              </div>
            </div>
            {live.length > 1 && (
              <div>
                <p className="mb-2 text-sm text-ink-2">{hi ? "प्लेटफ़ॉर्म" : "Platform"}</p>
                <div className="flex gap-2">
                  {live.map((p) => (
                    <button key={p} type="button" onClick={() => set("platform", p)} className={chip(i.platform === p)}>
                      {CHANNEL_NAME[p]}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="mb-2 text-sm text-ink-2">{hi ? "ऑफ़र" : "Offer"}</p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["percent", hi ? "% छूट" : "% off"],
                    ["flat", hi ? "फ़्लैट छूट" : "Flat off"],
                    ["freebie", hi ? "फ़्री आइटम" : "Free item"],
                    ["ads", hi ? "ऐड बूस्ट" : "Ad boost"],
                  ] as const
                ).map(([id, label]) => (
                  <button key={id} type="button" onClick={() => set("offer", id)} className={chip(i.offer === id)}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {i.offer === "percent" && (
                <>
                  <Num label={hi ? "छूट %" : "Discount %"} value={i.value} min={5} max={60} onChange={(v) => set("value", v)} className={field} />
                  <Num label={hi ? "अधिकतम ₹" : "Up to ₹"} value={i.upTo} min={0} max={500} onChange={(v) => set("upTo", v)} className={field} />
                </>
              )}
              {i.offer === "flat" && <Num label={hi ? "छूट ₹" : "Off ₹"} value={i.value} min={10} max={500} onChange={(v) => set("value", v)} className={field} />}
              {i.offer === "freebie" && (
                <>
                  <label className="block">
                    <span className="mb-1 block text-sm text-ink-2">{hi ? "फ़्री आइटम" : "Free item"}</span>
                    <input value={i.dish ?? ""} onChange={(e) => set("dish", e.target.value)} placeholder={hi ? "जैसे गुलाब जामुन" : "e.g. dessert"} className={field} />
                  </label>
                  <Num label={hi ? "आपकी लागत ₹" : "Your cost ₹"} value={i.value} min={10} max={500} onChange={(v) => set("value", v)} className={field} />
                </>
              )}
              {i.offer === "ads" && (
                <label className="col-span-2 block">
                  <span className="mb-1 block text-sm text-ink-2">{hi ? "किस डिश के लिए (ज़रूरी नहीं)" : "Dish to feature (optional)"}</span>
                  <input value={i.dish ?? ""} onChange={(e) => set("dish", e.target.value)} className={field} />
                </label>
              )}
              {i.offer !== "ads" && <Num label={hi ? "न्यूनतम ऑर्डर ₹" : "Min order ₹"} value={i.minOrder} min={0} max={2000} onChange={(v) => set("minOrder", v)} className={field} />}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="col-span-2 block sm:col-span-1">
                <span className="mb-1 block text-sm text-ink-2">{hi ? "कब" : "When"}</span>
                <select value={WINDOWS.includes(i.window) ? i.window : "custom"} onChange={(e) => e.target.value !== "custom" && set("window", e.target.value)} className={field}>
                  {!WINDOWS.includes(i.window) && <option value="custom">{i.window}</option>}
                  {WINDOWS.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </label>
              <Num label={hi ? "कितने दिन" : "Days"} value={i.days} min={1} max={60} onChange={(v) => set("days", v)} className={field} />
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-ink-2">{hi ? "ख़र्च की सीमा" : "Spend cap"}</span>
                <span className="text-lg font-semibold">{rupees(i.budget)}</span>
              </div>
              <input type="range" min={500} max={limit} step={250} value={Math.min(i.budget, limit)} onChange={(e) => set("budget", Number(e.target.value))} className="mt-2 w-full accent-[var(--ink)]" aria-label={hi ? "ख़र्च की सीमा" : "Spend cap"} />
              <p className="mt-1 text-xs text-muted">{hi ? `एक कैंपेन की अधिकतम सीमा ${rupees(limit)}` : `No campaign can spend more than ${rupees(limit)}`}</p>
            </div>
          </div>

          <div className="flex flex-col rounded-2xl bg-paper p-5 shadow-[inset_0_0_0_1px_var(--line)]">
            <p className="text-sm text-muted">{hi ? "अनुमान" : "What to expect"}</p>
            {est ? (
              <>
                <p className="mt-1 text-lg font-medium">{est.offerText}</p>
                <p className="text-sm text-ink-2">
                  {CHANNEL_NAME[i.platform]} · {i.window || "All day"} · {i.days} {hi ? "दिन" : "days"}
                </p>
                <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4">
                  <Stat label={hi ? "अतिरिक्त ऑर्डर" : "Extra orders"} value={`~${est.extraOrders}`} />
                  <Stat label={hi ? "ख़र्च" : "Spend"} value={rupees(est.spend)} />
                  <Stat label={hi ? "अतिरिक्त बिक्री" : "Extra sales"} value={rupees(est.revenue)} />
                  <Stat label={hi ? "रिटर्न" : "Return"} value={`${est.returnOnSpend}×`} tone={good ? "text-leaf" : "text-chilli"} />
                </dl>
                <p className="mt-5 text-xs leading-relaxed text-muted">
                  {est.basis.fromHistory
                    ? hi
                      ? `पिछले ${est.basis.days} दिन के आपके ऑर्डर पर आधारित: दिन में ${est.basis.ordersPerDay} ऑर्डर, ${rupees(est.basis.avgOrder)} औसत।`
                      : `Based on your last ${est.basis.days} days: ${est.basis.ordersPerDay} orders a day at ${rupees(est.basis.avgOrder)} on average.`
                    : null}
                  {!good && (hi ? " 3× से कम रिटर्न वाले कैंपेन अपने-आप रुक जाते हैं।" : " Campaigns returning under 3× pause themselves.")}
                </p>
                {est.notes.map((n, k) => (
                  <p key={k} className="mt-2 text-xs leading-relaxed text-turmeric">
                    {pick(n)}
                  </p>
                ))}
              </>
            ) : (
              <p className="mt-4 flex items-center gap-2 text-sm text-muted">
                <Loader2 aria-hidden className="size-4 animate-spin" />
                {hi ? "हिसाब लगा रहे हैं…" : "Working it out…"}
              </p>
            )}
            {estError && <p className="mt-3 text-sm text-chilli">{estError}</p>}
            <button type="button" onClick={send} disabled={sending || !est} className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 font-medium text-paper disabled:opacity-40">
              {sending && <Loader2 aria-hidden className="size-4 animate-spin" />}
              {hi ? "मंज़ूरी के लिए भेजें" : "Send for approval"}
            </button>
          </div>
        </div>
      )}
    </motion.section>
  );
}

function Num({ label, value, min, max, onChange, className }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void; className: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-ink-2">{label}</span>
      <input type="number" inputMode="numeric" min={min} max={max} value={value} onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || 0)))} className={className} />
    </label>
  );
}

function Stat({ label, value, tone = "" }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <dt className="text-sm text-muted">{label}</dt>
      <dd className={`text-[1.45rem] font-semibold leading-tight tracking-tight ${tone}`}>{value}</dd>
    </div>
  );
}

function CampaignRow({ c, onControl }: { c: CampaignDTO; onControl: (a: "pause" | "resume" | "end") => void }) {
  const { lang, pick } = useApp();
  const hi = lang === "hi";
  const r = ret(c);
  const pct = Math.min(100, Math.round((c.spent / c.spendCap) * 100));
  const date = (iso: string) => new Date(iso).toLocaleDateString(hi ? "hi-IN" : "en-IN", { day: "numeric", month: "short" });
  return (
    <li className="rounded-2xl bg-surface p-4 shadow-[0_0_0_1px_var(--line)] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <ChannelTag channel={c.platform} />
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS[c.status].tone}`}>{pick(STATUS[c.status])}</span>
            {c.kind === "ad" && <span className="rounded-full bg-sunken px-2 py-0.5 text-xs text-ink-2">{hi ? "ऐड" : "Ad"}</span>}
          </div>
          <p className="mt-1.5 font-medium">{c.title}</p>
          <p className="text-sm text-muted">
            {c.window} · {date(c.startsAt)}
            {c.endsAt ? ` – ${date(c.endsAt)}` : ""}
          </p>
          {c.statusDetail && <p className={`mt-1 text-sm ${c.status === "paused" ? "text-chilli" : "text-ink-2"}`}>{c.statusDetail}</p>}
        </div>
        {c.status !== "ended" && (
          <div className="flex gap-2 text-sm">
            {c.status === "live" ? (
              <button type="button" onClick={() => onControl("pause")} className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 shadow-[inset_0_0_0_1px_var(--line)] hover:bg-sunken">
                <Pause aria-hidden className="size-3.5" />
                {hi ? "रोकें" : "Pause"}
              </button>
            ) : (
              <button type="button" onClick={() => onControl("resume")} className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 shadow-[inset_0_0_0_1px_var(--line)] hover:bg-sunken">
                <Play aria-hidden className="size-3.5" />
                {hi ? "फिर चालू करें" : "Resume"}
              </button>
            )}
            <button type="button" onClick={() => onControl("end")} className="inline-flex items-center gap-1 px-2 py-1.5 text-muted hover:text-ink">
              <Square aria-hidden className="size-3" />
              {hi ? "ख़त्म करें" : "End"}
            </button>
          </div>
        )}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="col-span-2 sm:col-span-1">
          <p className="text-sm text-muted">{hi ? "ख़र्च" : "Spent"}</p>
          <p className="font-semibold">
            {rupees(c.spent)} <span className="font-normal text-muted">/ {rupees(c.spendCap)}</span>
          </p>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-sunken" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className={`h-full rounded-full ${pct >= 100 ? "bg-ink-2" : "bg-turmeric"}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div>
          <p className="text-sm text-muted">{hi ? "ऑर्डर" : "Orders"}</p>
          <p className="font-semibold">
            {c.orders} <span className="font-normal text-muted">/ ~{c.expectedOrders}</span>
          </p>
        </div>
        <div>
          <p className="text-sm text-muted">{hi ? "बिक्री" : "Sales"}</p>
          <p className="font-semibold">{rupees(c.revenue)}</p>
        </div>
        <div>
          <p className="text-sm text-muted">{hi ? "रिटर्न" : "Return"}</p>
          <p className={`font-semibold ${!c.spent ? "" : r >= c.minReturn ? "text-leaf" : "text-chilli"}`}>{c.spent ? `${r.toFixed(1)}×` : hi ? "अभी नहीं" : "Not yet"}</p>
        </div>
      </div>
    </li>
  );
}
