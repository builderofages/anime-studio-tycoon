import { verifyGrant } from "./_jwt.js";
import { normalizeGrantPt, sanitizeGrantPayload } from "./_grant-security.js";
import { ledgerCommand } from "./_ledger.js";

/** POST {pt, delivery_id, action?: 'ack'}; GET never changes purchase state. */
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "POST only" });
  const jwtSecret = process.env.GRANT_JWT_SECRET;
  if (!jwtSecret) return res.status(503).json({ ok: false, error: "GRANT_JWT_SECRET not configured" });
  const pt = normalizeGrantPt(req.body?.pt);
  if (!pt) return res.status(400).json({ ok: false, error: "pt required" });
  const data = verifyGrant(pt, jwtSecret);
  if (!data) return res.status(400).json({ ok: false, error: "invalid or expired token" });
  if (!sanitizeGrantPayload(data)) return res.status(400).json({ ok: false, error: "invalid grant payload" });
  if (data.ledger !== 1 || !/^[a-f0-9]{64}$/.test(data.owner || "") || !/^[a-f0-9]{64}$/.test(data.transaction || "")) {
    return res.status(409).json({ ok: false, error: "verify license again" });
  }
  const delivery = req.body?.delivery_id;
  if (typeof delivery !== "string" || !/^[a-f0-9]{64}$/.test(delivery)) {
    return res.status(400).json({ ok: false, error: "delivery_id required" });
  }
  const action = req.body?.action || "claim";
  if (!["claim", "ack"].includes(action)) return res.status(400).json({ ok: false, error: "invalid action" });
  try {
    const result = await ledgerCommand(action, data.transaction, data.owner, delivery);
    if (!result.ok) return res.status(409).json(result);
    return res.status(200).json({ ...result, durable: true });
  } catch {
    return res.status(503).json({ ok: false, error: "purchase storage unavailable" });
  }
}
