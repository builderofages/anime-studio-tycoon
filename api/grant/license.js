import { mintFromPurchase } from "./_mint.js";

/** POST { permalink?, sku?, license_key } → { ok, pt, redirect } */
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "POST only" });
  const { permalink, sku, license_key: licenseKey } = req.body || {};
  const result = await mintFromPurchase({ permalink, sku, licenseKey });
  return res.status(result.status || (result.ok ? 200 : 400)).json(result);
}