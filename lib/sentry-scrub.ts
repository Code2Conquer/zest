// Error reports must not carry customers' or owners' personal data or secrets: no phone numbers, no request
// bodies, cookies or auth headers, no private tracking links, and no IP addresses.

const PHONE = /\+?91[\s-]?\d{5}[\s-]?\d{5}|\b[6-9]\d{9}\b/g;
// An order's private tracking link (/t/<token>) and any token-like query value.
const TRACKING = /\/t\/[A-Za-z0-9_-]{8,}/g;
const SECRET_QS = /([?&](?:t|token|code|key|state)=)[^&#\s]+/gi;

const clean = (s: string) => s.replace(PHONE, "[phone]").replace(TRACKING, "/t/[token]").replace(SECRET_QS, "$1[redacted]");

type Crumb = { message?: string; data?: Record<string, unknown>; [k: string]: unknown };
type Scrubbable = {
  message?: string;
  request?: { data?: unknown; cookies?: unknown; headers?: Record<string, string>; query_string?: unknown; url?: string; [k: string]: unknown };
  exception?: { values?: { value?: string }[] };
  breadcrumbs?: Crumb[];
  user?: { ip_address?: string; [k: string]: unknown };
  transaction?: string;
  [k: string]: unknown;
};

/** Returns a copy of a Sentry event (or any object shaped like one) with personal data and secrets removed. */
export function scrubEvent<T extends object>(event: T): T {
  const out = { ...event } as Scrubbable;
  if (typeof out.message === "string") out.message = clean(out.message);
  if (typeof out.transaction === "string") out.transaction = clean(out.transaction);
  if (out.request) {
    const { data: _body, cookies: _cookies, query_string: _qs, headers, url, ...rest } = out.request;
    const safeHeaders = headers ? Object.fromEntries(Object.entries(headers).filter(([k]) => !/cookie|authorization|x-forwarded-for|x-real-ip/i.test(k))) : undefined;
    out.request = { ...rest, ...(url ? { url: clean(url) } : {}), ...(safeHeaders ? { headers: safeHeaders } : {}) };
  }
  if (out.exception?.values) out.exception = { ...out.exception, values: out.exception.values.map((v) => ({ ...v, value: v.value ? clean(v.value) : v.value })) };
  if (out.breadcrumbs) out.breadcrumbs = out.breadcrumbs.map((b) => ({ ...b, ...(b.message ? { message: clean(b.message) } : {}), ...(b.data ? { data: JSON.parse(clean(JSON.stringify(b.data))) } : {}) }));
  if (out.user) {
    const { ip_address: _ip, ...user } = out.user;
    out.user = user;
  }
  return out as T;
}
