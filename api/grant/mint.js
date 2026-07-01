import { signGrant } from "./_jwt.js";

/** POST { secret, kind, amount?, sku?, id? } → { ok, pt, redirect } */
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "POST only" });
  const mintSecret = process.env.GRANT_MINT_SECRET;
  const jwtSecret = process.env.GRANT_JWT_SECRET;
  if (!mintSecret || !jwtSecret) {
    return res.status(503).json({ ok: false, error: "GRANT_MINT_SECRET / GRANT_JWT_SECRET not configured" });
  }
  const { secret, kind, amount, sku, id } = req.body || {};
  if (secret !== mintSecret || !kind) return res.status(401).json({ ok: false, error: "unauthorized" });

  const pt = signGrant({ kind, amount: amount || 0, sku: sku || null, id: id || null }, jwtSecret);
  const base = process.env.GRANT_REDIRECT_BASE || "https://anime-studio-tycoon.vercel.app/";
  const redirect = base + (base.includes("?") ? "&" : "?") + "pt=" + encodeURIComponent(pt);
  return res.status(200).json({ ok: true, pt, redirect });
}