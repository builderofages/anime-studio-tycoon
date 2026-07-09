import crypto from "crypto";
import { signGrant } from "./_jwt.js";
import { grantFromPermalink, grantFromSku, permalinkForSku } from "./_sku-map.js";
import { verifyGumroadLicense } from "./_gumroad.js";
import { ALLOWED_GRANT_KINDS } from "./_grant-security.js";

/** BUILD 108 — grant security: deterministic id for license replay prevention. */
export function stableGrantId(licenseKey, grant) {
  if (!licenseKey || !grant) return null;
  const raw = [String(licenseKey).trim().toLowerCase(), grant.kind, grant.amount || 0, grant.sku || "", grant.id || ""].join("|");
  return crypto.createHash("sha256").update(raw).digest("hex").slice(0, 32);
}

/** BUILD 108 — grant security: stable id for admin mint (secret-gated). */
export function adminStableGrantId({ kind, amount, sku, id }) {
  const raw = ["admin", kind, amount || 0, sku || "", id || ""].join("|");
  return crypto.createHash("sha256").update(raw).digest("hex").slice(0, 32);
}

export async function mintFromPurchase({ permalink, sku, licenseKey }) {
  const jwtSecret = process.env.GRANT_JWT_SECRET;
  if (!jwtSecret) return { ok: false, error: "GRANT_JWT_SECRET not configured", status: 503 };
  const grant = grantFromPermalink(permalink) || grantFromSku(sku);
  if (!grant) return { ok: false, error: "unknown product", status: 400 };

  const lk = licenseKey != null ? String(licenseKey).trim() : "";
  const skipVerify = process.env.GUMROAD_SKIP_LICENSE_VERIFY === "true";
  if (!lk) return { ok: false, error: "license_key required", status: 400 };

  if (!skipVerify) {
    const slug = permalink || permalinkForSku(sku) || sku;
    const ok = await verifyGumroadLicense(slug, lk);
    if (!ok) return { ok: false, error: "invalid license", status: 400 };
  }

  const gid = stableGrantId(lk, grant);
  if (!gid) return { ok: false, error: "grant id error", status: 500 };

  const pt = signGrant(
    { kind: grant.kind, amount: grant.amount || 0, sku: grant.sku || null, id: grant.id || null, gid },
    jwtSecret
  );
  const base = process.env.GRANT_REDIRECT_BASE || "https://anime-studio-tycoon.vercel.app/";
  const sep = base.includes("?") ? "&" : "?";
  return { ok: true, pt, grant, redirect: base + sep + "pt=" + encodeURIComponent(pt) };
}

/** Validate admin mint body before signing. */
export function validateMintBody({ kind, amount, sku, id }) {
  const k = typeof kind === "string" ? kind.trim() : "";
  if (!k || !ALLOWED_GRANT_KINDS.has(k)) return { ok: false, error: "invalid kind", status: 400 };
  const amt = amount != null ? Number(amount) : 0;
  if (!Number.isFinite(amt) || amt < 0 || amt > 100_000) return { ok: false, error: "invalid amount", status: 400 };
  if (k === "gems" && amt <= 0) return { ok: false, error: "gems amount required", status: 400 };
  if (k === "star" && !String(sku || id || "").trim()) return { ok: false, error: "star sku or id required", status: 400 };
  return {
    ok: true,
    payload: {
      kind: k,
      amount: Math.floor(amt),
      sku: sku != null && sku !== "" ? String(sku).trim().slice(0, 64) : null,
      id: id != null && id !== "" ? String(id).trim().slice(0, 64) : null,
    },
  };
}