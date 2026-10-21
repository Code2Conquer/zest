import "server-only";
import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

// 32-byte key from ZEST_SECRET_KEY (base64). In development a key is generated
// once and kept in .data/secret.key so stored credentials survive restarts.
function loadKey(): Buffer {
  const fromEnv = process.env.ZEST_SECRET_KEY;
  if (fromEnv) {
    const key = Buffer.from(fromEnv, "base64");
    if (key.length !== 32) throw new Error("ZEST_SECRET_KEY must be 32 bytes, base64-encoded.");
    return key;
  }
  if (process.env.NODE_ENV === "production") throw new Error("Set ZEST_SECRET_KEY in production.");
  const dir = process.env.ZEST_DATA_DIR ?? ".data";
  const path = `${dir}/secret.key`;
  if (!existsSync(path)) {
    mkdirSync(dir, { recursive: true });
    writeFileSync(path, randomBytes(32).toString("base64"), { mode: 0o600 });
  }
  return Buffer.from(readFileSync(path, "utf8"), "base64");
}

let key: Buffer | null = null;
const getKey = () => (key ??= loadKey());

/** AES-256-GCM. Output is iv.tag.ciphertext, base64url. */
export function encrypt(plain: unknown): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const data = Buffer.concat([cipher.update(JSON.stringify(plain), "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString("base64url")).join(".");
}

export function decrypt<T = Record<string, string>>(sealed: string): T {
  const [iv, tag, data] = sealed.split(".").map((p) => Buffer.from(p, "base64url"));
  const decipher = createDecipheriv("aes-256-gcm", getKey(), iv);
  decipher.setAuthTag(tag);
  return JSON.parse(Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8")) as T;
}

/** Keyed hash for short secrets such as staff PINs: comparable, never reversible without the key. */
export function hmac(value: string): string {
  return createHmac("sha256", getKey()).update(value).digest("base64url");
}

export function sign(value: string): string {
  return `${value}.${createHmac("sha256", getKey()).update(value).digest("base64url")}`;
}

export function unsign(signed: string | undefined): string | null {
  if (!signed) return null;
  const i = signed.lastIndexOf(".");
  if (i < 0) return null;
  const value = signed.slice(0, i);
  const expected = Buffer.from(sign(value));
  const actual = Buffer.from(signed);
  return expected.length === actual.length && timingSafeEqual(expected, actual) ? value : null;
}

/** Shows enough of a secret to recognise it, never the whole thing. */
export function mask(value: string): string {
  if (value.length <= 4) return "••••";
  return `${"•".repeat(Math.min(6, value.length - 4))}${value.slice(-4)}`;
}
