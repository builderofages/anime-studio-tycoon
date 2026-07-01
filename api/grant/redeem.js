import { verifyGrant } from "./_jwt.js";

/** GET ?pt= → { ok, grant: { kind, amount, sku, id } } */
export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ ok: false, error: "GET only" });
  const jwtSecret = process.env.GRANT_JWT_SECRET;
  if (!jwtSecret) return res.status(503).json({ ok: false, error: "GRANT_JWT_SECRET not configured" });

  const pt = req.query?.pt;
  const data = verifyGrant(pt, jwtSecret);
  if (!data) return res.status(400).json({ ok: false, error: "invalid or expired token" });

  return res.status(200).json({
    ok: true,
    grant: { kind: data.kind, amount: data.amount || 0, sku: data.sku || null, id: data.id || null },
  });
}