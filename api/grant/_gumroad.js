/** Verify a Gumroad license key (requires GUMROAD_ACCESS_TOKEN). */
export async function verifyGumroadLicense(productPermalink, licenseKey) {
  const token = process.env.GUMROAD_ACCESS_TOKEN;
  if (!token || !licenseKey) return false;

  const slug = String(productPermalink).toLowerCase().replace(/^.*\//, "").split("?")[0];
  const body = new URLSearchParams({
    product_permalink: slug,
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
  });

  const j = await r.json();
  return !!(j.success && j.purchase && !j.purchase.refunded);
}

export function parseGumroadBody(req) {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) return req.body;
  return req.body || {};
}