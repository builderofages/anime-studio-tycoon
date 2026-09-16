import { validateMintBody } from "./_mint.js";

/** POST { secret, kind, amount?, sku?, id? } → { ok, pt, redirect } */
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "POST only" });
  const mintSecret = process.env.GRANT_MINT_SECRET;
  const jwtSecret = process.env.GRANT_JWT_SECRET;
  if (!mintSecret || !jwtSecret) {
    return res.status(503).json({ ok: false, error: "GRANT_MINT_SECRET / GRANT_JWT_SECRET not configured" });
  }

  const body = req.body && typeof req.body === "object" ? req.body : {};
  const { secret, kind, amount, sku, id } = body;
  if (typeof secret !== "string" || secret !== mintSecret) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  const validated = validateMintBody({ kind, amount, sku, id });
  if (!validated.ok) return res.status(validated.status || 400).json({ ok: false, error: validated.error });

  return res.status(503).json({ ok: false, error: "Manual grants are disabled until they have a durable issuance record" });
}
