import { mintFromPurchase } from "./_mint.js";

/**
 * Gumroad post-purchase redirect target.
 * Set each product's redirect URL to:
 *   https://anime-studio-tycoon.vercel.app/api/grant/finish?permalink=SLUG&license_key={license_key}
 */
export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).send("GET only");

  const permalink = req.query?.permalink || req.query?.product_permalink;
  const licenseKey = req.query?.license_key;
  const result = await mintFromPurchase({ permalink, licenseKey });

  if (!result.ok) {
    const msg = result.error === "invalid license"
      ? "Could not verify purchase. Email support@trainyouragent.com with your receipt."
      : result.error === "license_key required"
        ? "Missing license_key — enable license keys on this Gumroad product."
        : result.error === "unknown product"
          ? "Unknown product — contact support@trainyouragent.com"
          : result.error || "error";
    return res.status(result.status || 400).send(msg);
  }

  res.redirect(302, result.redirect);
}