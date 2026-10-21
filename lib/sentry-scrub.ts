// Error reports must not carry customers' or owners' phone numbers, or request bodies.

const PHONE = /\+?91[\s-]?\d{5}[\s-]?\d{5}|\b[6-9]\d{9}\b/g;

type Scrubbable = { message?: string; request?: { data?: unknown; [k: string]: unknown }; exception?: { values?: { value?: string }[] }; [k: string]: unknown };

/** Returns a copy of a Sentry event (or any object shaped like one) without phone numbers or request bodies. */
export function scrubEvent<T extends object>(event: T): T {
  const out = { ...event } as Scrubbable;
  if (typeof out.message === "string") out.message = out.message.replace(PHONE, "[phone]");
  if (out.request) {
    const { data: _dropped, ...rest } = out.request;
    out.request = rest;
  }
  if (out.exception?.values) out.exception = { ...out.exception, values: out.exception.values.map((v) => ({ ...v, value: v.value?.replace(PHONE, "[phone]") })) };
  return out as T;
}
