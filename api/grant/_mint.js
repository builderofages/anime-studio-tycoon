import { signGrant } from "./_jwt.js";
import { grantFromPermalink, grantFromSku } from "./_sku-map.js";
import { verifyGumroadLicense } from "./_gumroad.js";

export async function mintFromPurchase({ permalink, sku, licenseKey }) {
  const jwtSecret = process.env.GRANT_JWT_SECRET;
  if (!jwtSecret) return { ok: false, error: "GRANT_JWT_SECRET not configured", status: 503 };

  const grant = grantFromPermalink(permalink) || grantFromSku(sku);
  if (!grant) return { ok: false, error: "unknown product", status: 400 };

  const skipVerify = process.env.GUMROAD_SKIP_LICENSE_VERIFY === "true";
  if (!skipVerify) {
    if (!licenseKey) {
      return { ok: false, error: "license_key required", status: 400 };
    }
    const slug = permalink || sku;
    const ok = await verifyGumroadLicense(slug, licenseKey);
    if (!ok) return { ok: false, error: "invalid license", status: 400 };
  }

  const pt = signGrant(
    { kind: grant.kind, amount: grant.amount || 0, sku: grant.sku || null, id: grant.id || null },
    jwtSecret
  );
  const base = process.env.GRANT_REDIRECT_BASE || "https://anime-studio-tycoon.vercel.app/";
  const sep = base.includes("?") ? "&" : "?";
  return { ok: true, pt, grant, redirect: base + sep + "pt=" + encodeURIComponent(pt) };
}