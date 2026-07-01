import crypto from "crypto";

const TTL_MS = 15 * 60 * 1000;

export function signGrant(payload, secret) {
  const exp = Date.now() + TTL_MS;
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  return body + "." + sig;
}

export function verifyGrant(token, secret) {
  if (!token || !secret) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expect = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  if (sig.length !== expect.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!data.exp || data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}