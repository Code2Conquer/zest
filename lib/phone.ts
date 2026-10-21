/** An Indian mobile number as +91XXXXXXXXXX, from the ways people type it. Throws when it isn't one. */
export function normalizePhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (!/^[6-9]\d{9}$/.test(digits)) throw new Error("Enter a 10-digit Indian mobile number.");
  return `+91${digits}`;
}
