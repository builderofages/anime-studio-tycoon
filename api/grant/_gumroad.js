/** Verify product, seller and payment status before trusting purchase ownership. */
export async function verifyGumroadLicense(productPermalink, licenseKey) {
  const token = process.env.GUMROAD_ACCESS_TOKEN;
  const seller = process.env.GUMROAD_SELLER_ID;
  if (!token || !seller || !licenseKey) return null;

  const slug = String(productPermalink).toLowerCase().replace(/^.*\//, "").split("?")[0];
  // Gumroad requires product_id for products created since January 2023.
  const ids = JSON.parse(process.env.GUMROAD_PRODUCT_IDS_JSON || "{}");
  const productId = Object.hasOwn(ids, slug) && ids[slug];
  if (typeof productId !== "string" || !productId) throw new Error("Gumroad product ID not configured");
  const body = new URLSearchParams({
    product_id: productId,
    license_key: licenseKey,
    increment_uses_count: "false",
  });

  const r = await fetch("https://api.gumroad.com/v2/licenses/verify", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    signal: AbortSignal.timeout(10000),
  });

  if (!r.ok) throw new Error("Gumroad verification unavailable");
  const j = await r.json();
  const p = j.purchase;
  if (!j.success || !p || p.product_id !== productId || p.seller_id !== seller ||
      p.refunded || p.chargebacked || (p.disputed && !p.dispute_won)) return null;
  return p;
}

export function parseGumroadBody(req) {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) return req.body;
  return req.body || {};
}
