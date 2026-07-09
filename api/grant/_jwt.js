import crypto from "crypto";
import { splitGrantToken } from "./_grant-security.js";

const TTL_MS = 15 * 60 * 1000;

export function signGrant(payload, secret) {
  const exp = Date.now() + TTL_MS;
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  return body + "." + sig;
}

/** BUILD 108 — grant security: timing-safe HMAC verify + strict token shape. */
export function verifyGrant(token, secret) {
  if (!token || !secret) return null;
  const parts = splitGrantToken(token);
  if (!parts) return null;
  const { body, sig } = parts;
  const expect = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  if (sig.length !== expect.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!data || typeof data !== "object") return null;
    const exp = Number(data.exp);
    if (!Number.isFinite(exp) || exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}