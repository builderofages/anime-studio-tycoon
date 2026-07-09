import { verifyGrant } from "./_jwt.js";
import { normalizeGrantPt, sanitizeGrantPayload } from "./_grant-security.js";

/** GET ?pt= → { ok, grant: { kind, amount, sku, id, gid } } */
export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ ok: false, error: "GET only" });
  const jwtSecret = process.env.GRANT_JWT_SECRET;
  if (!jwtSecret) return res.status(503).json({ ok: false, error: "GRANT_JWT_SECRET not configured" });

  const pt = normalizeGrantPt(req.query?.pt);
  if (!pt) return res.status(400).json({ ok: false, error: "pt required" });

  const data = verifyGrant(pt, jwtSecret);
  if (!data) return res.status(400).json({ ok: false, error: "invalid or expired token" });

  const grant = sanitizeGrantPayload(data);
  if (!grant) return res.status(400).json({ ok: false, error: "invalid grant payload" });

  return res.status(200).json({ ok: true, grant });
}