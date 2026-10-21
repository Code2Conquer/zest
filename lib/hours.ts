import type { Channel } from "./platforms";

// Opening hours, read in India time whatever the server's clock. Shared by server and browser.

export type DayHours = { weekday: number; opens: string; closes: string; channel?: Channel | null };
/** Weekly spans; weekday 0 is Sunday. A span whose close is at or before its open runs past midnight. */
export type WeeklyHours = DayHours[];
/** Dated exceptions that replace that date's weekly hours for every channel. */
export type SpecialHours = { date: string; closed: boolean; opens?: string; closes?: string; note?: string }[];

const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;
export const isTime = (s: string) => TIME.test(s);
const minutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", weekday: "short", hourCycle: "h23" });
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** The India date, weekday and minute of the day for an instant. */
function ist(at: Date) {
  const p = Object.fromEntries(parts.formatToParts(at).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, weekday: WEEKDAYS.indexOf(p.weekday), minute: Number(p.hour) * 60 + Number(p.minute) };
}

const DAY_MS = 86_400_000;
const atIst = (date: string, hhmm: string) => new Date(`${date}T${hhmm}:00+05:30`);

/** The spans that start on this date for this channel. */
function spansFor(weekly: WeeklyHours, special: SpecialHours, date: string, weekday: number, channel?: Channel) {
  const exception = special.find((s) => s.date === date);
  if (exception) return exception.closed || !exception.opens || !exception.closes ? [] : [{ opens: exception.opens, closes: exception.closes }];
  const own = channel ? weekly.filter((h) => h.weekday === weekday && h.channel === channel) : [];
  return own.length ? own : weekly.filter((h) => h.weekday === weekday && !h.channel);
}

export function isOpenAt(weekly: WeeklyHours, special: SpecialHours, at: Date, channel?: Channel): boolean {
  const now = ist(at);
  const before = ist(new Date(at.getTime() - DAY_MS));
  for (const s of spansFor(weekly, special, now.date, now.weekday, channel)) {
    const o = minutes(s.opens);
    const c = minutes(s.closes);
    if (c <= o ? now.minute >= o : now.minute >= o && now.minute < c) return true;
  }
  // Late-night spans that began yesterday.
  for (const s of spansFor(weekly, special, before.date, before.weekday, channel)) {
    if (minutes(s.closes) <= minutes(s.opens) && now.minute < minutes(s.closes)) return true;
  }
  return false;
}

/** When the open/closed state next flips, within 7 days; null if it never does. */
export function nextChange(weekly: WeeklyHours, special: SpecialHours, at: Date, channel?: Channel): { open: boolean; at: Date } | null {
  const openNow = isOpenAt(weekly, special, at, channel);
  const edges: Date[] = [];
  for (let d = -1; d <= 7; d++) {
    const day = ist(new Date(at.getTime() + d * DAY_MS));
    for (const s of spansFor(weekly, special, day.date, day.weekday, channel)) {
      edges.push(atIst(day.date, s.opens));
      const close = atIst(day.date, s.closes);
      edges.push(minutes(s.closes) <= minutes(s.opens) ? new Date(close.getTime() + DAY_MS) : close);
    }
    // Midnight of a special date can also change the state (its rules replace the weekly ones).
    edges.push(atIst(day.date, "00:00"));
  }
  const limit = at.getTime() + 7 * DAY_MS;
  for (const e of edges.filter((e) => e.getTime() > at.getTime() && e.getTime() <= limit).sort((a, b) => a.getTime() - b.getTime())) {
    const open = isOpenAt(weekly, special, e, channel);
    if (open !== openNow) return { open, at: e };
  }
  return null;
}

/** Overlapping spans on one weekday for the same channel, which the editor refuses. */
export function overlaps(weekly: WeeklyHours): boolean {
  const groups = new Map<string, [number, number][]>();
  for (const h of weekly) {
    const o = minutes(h.opens);
    const c = minutes(h.closes) <= o ? 1440 + minutes(h.closes) : minutes(h.closes);
    const key = `${h.weekday}|${h.channel ?? ""}`;
    groups.set(key, [...(groups.get(key) ?? []), [o, c]]);
  }
  for (const spans of groups.values()) {
    const sorted = spans.sort((a, b) => a[0] - b[0]);
    for (let i = 1; i < sorted.length; i++) if (sorted[i][0] < sorted[i - 1][1]) return true;
  }
  return false;
}
