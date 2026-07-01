import { signGrant } from "./_jwt.js";
import { grantFromPermalink } from "./_sku-map.js";
import { verifyGumroadLicense } from "./_gumroad.js";

/**
 * Gumroad post-purchase redirect target.
 * Set each product's redirect URL to:
 *   https://anime-studio-tycoon.vercel.app/api/grant/finish?permalink=SLUG&license_key={license_key}
 */
export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).send("GET only");

  const jwtSecret = process.env.GRANT_JWT_SECRET;
  if (!jwtSecret) return res.status(503).send("GRANT_JWT_SECRET not configured");

  const permalink = req.query?.permalink || req.query?.product_permalink;
  const licenseKey = req.query?.license_key;
  const grant = grantFromPermalink(permalink);

  if (!grant) {
    return res.status(400).send("Unknown product — contact support@trainyouragent.com");
  }

  const skipVerify = process.env.GUMROAD_SKIP_LICENSE_VERIFY === "true";
  if (!skipVerify) {
    if (!licenseKey) {
      return res.status(400).send("Missing license_key — enable license keys on this Gumroad product.");
    }
    const ok = await verifyGumroadLicense(permalink, licenseKey);
    if (!ok) return res.status(400).send("Could not verify purchase. Email support@trainyouragent.com with your receipt.");
  }

  const pt = signGrant(
    { kind: grant.kind, amount: grant.amount || 0, sku: grant.sku || null, id: grant.id || null },
    jwtSecret
  );

  const base = process.env.GRANT_REDIRECT_BASE || "https://anime-studio-tycoon.vercel.app/";
  const sep = base.includes("?") ? "&" : "?";
  res.redirect(302, base + sep + "pt=" + encodeURIComponent(pt));
}