/** BUILD 108 — grant security: shared validation for signed purchase tokens. */

export const ALLOWED_GRANT_KINDS = new Set([
  "pass",
  "bundle",
  "bundle_legend",
  "bundle_mogul",
  "items_pack",
  "noads",
  "gems",
  "star",
]);

export const MAX_GRANT_TOKEN_LEN = 4096;
export const MAX_GEM_AMOUNT = 100_000;

/** Normalize ?pt= query (Vercel may pass string[]). */
export function normalizeGrantPt(pt) {
  if (pt == null) return null;
  const raw = Array.isArray(pt) ? pt[0] : pt;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > MAX_GRANT_TOKEN_LEN) return null;
  return trimmed;
}

/** Split JWT-like token; reject extra dot segments (forgery / parser confusion). */
export function splitGrantToken(token) {
  if (!token || typeof token !== "string") return null;
  if (token.length > MAX_GRANT_TOKEN_LEN) return null;
  const dot = token.indexOf(".");
  if (dot < 1 || dot === token.length - 1) return null;
  if (token.indexOf(".", dot + 1) !== -1) return null;
  return { body: token.slice(0, dot), sig: token.slice(dot + 1) };
}

/**
 * Validate signed grant payload before returning to client.
 * Requires stable gid for replay prevention (client redeemedGrants).
 */
export function sanitizeGrantPayload(data) {
  if (!data || typeof data !== "object") return null;
  const kind = typeof data.kind === "string" ? data.kind.trim() : "";
  if (!kind || !ALLOWED_GRANT_KINDS.has(kind)) return null;

  const gid = typeof data.gid === "string" ? data.gid.trim() : "";
  if (!gid || gid.length > 64 || !/^[a-f0-9]{16,64}$/i.test(gid)) return null;

  const out = { kind, gid };

  if (kind === "gems") {
    const amount = Number(data.amount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_GEM_AMOUNT) return null;
    out.amount = Math.floor(amount);
  } else if (data.amount != null && data.amount !== 0) {
    const amount = Number(data.amount);
    if (!Number.isFinite(amount) || amount < 0 || amount > MAX_GEM_AMOUNT) return null;
    out.amount = Math.floor(amount);
  } else {
    out.amount = 0;
  }

  if (kind === "star") {
    const sku = data.sku != null ? String(data.sku).trim().slice(0, 64) : "";
    const id = data.id != null ? String(data.id).trim().slice(0, 64) : "";
    if (!sku && !id) return null;
    if (sku) out.sku = sku;
    if (id) out.id = id;
  } else {
    if (data.sku != null && data.sku !== "") out.sku = String(data.sku).trim().slice(0, 64);
    if (data.id != null && data.id !== "") out.id = String(data.id).trim().slice(0, 64);
  }

  return out;
}