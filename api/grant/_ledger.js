import crypto from "node:crypto";

export function ledgerConfigured() {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

// All state transitions occur in one Redis transaction, across serverless instances.
// No TTL: completed purchases must remain recorded for the lifetime of the game.
export const LEDGER_SCRIPT = `
local raw = redis.call('GET', KEYS[1])
local op = ARGV[1]
if op == 'register' then
  local incoming = cjson.decode(ARGV[2])
  if raw then
    local existing = cjson.decode(raw)
    if existing.owner ~= incoming.owner or existing.product ~= incoming.product or existing.fingerprint ~= incoming.fingerprint then
      return cjson.encode({ok=false,error='purchase record mismatch'})
    end
    return cjson.encode({ok=true,record=existing})
  end
  redis.call('SET', KEYS[1], ARGV[2])
  return cjson.encode({ok=true,record=incoming})
end
if not raw then return cjson.encode({ok=false,error='purchase not registered'}) end
local record = cjson.decode(raw)
if record.owner ~= ARGV[2] then return cjson.encode({ok=false,error='purchase owner mismatch'}) end
if record.revoked then return cjson.encode({ok=false,error='purchase revoked'}) end
local delivery = ARGV[3]
if op == 'claim' then
  if record.status == 'delivered' then return cjson.encode({ok=true,mode='restore',grant=record.grant}) end
  if record.delivery and record.delivery ~= delivery then
    if record.grant.kind ~= 'gems' and record.grant.kind ~= 'items_pack' then
      return cjson.encode({ok=true,mode='restore',grant=record.grant})
    end
    return cjson.encode({ok=false,error='delivery pending on another device'})
  end
  record.delivery = delivery
  record.status = 'pending'
  redis.call('SET', KEYS[1], cjson.encode(record))
  return cjson.encode({ok=true,mode='deliver',grant=record.grant})
end
if op == 'ack' then
  if record.delivery ~= delivery then return cjson.encode({ok=false,error='delivery mismatch'}) end
  record.status = 'delivered'
  redis.call('SET', KEYS[1], cjson.encode(record))
  return cjson.encode({ok=true})
end
return cjson.encode({ok=false,error='unknown operation'})
`;

export async function ledgerCommand(operation, transaction, ...args) {
  if (!ledgerConfigured()) throw new Error("purchase storage not configured");
  if (!/^[a-f0-9]{64}$/.test(transaction)) throw new Error("invalid transaction");
  const url = new URL(process.env.UPSTASH_REDIS_REST_URL);
  if (url.protocol !== "https:" && !(process.env.NODE_ENV === "test" && ["127.0.0.1", "localhost"].includes(url.hostname))) {
    throw new Error("purchase storage requires HTTPS");
  }
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(["EVAL", LEDGER_SCRIPT, "1", `ast:purchase:v1:${transaction}`, operation, ...args]),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error("purchase storage unavailable");
  const body = await response.json();
  if (body.error || typeof body.result !== "string") throw new Error("purchase storage failed");
  return JSON.parse(body.result);
}

export function purchaseIdentity(purchase) {
  const sale = purchase.sale_id;
  const owner = purchase.purchaser_id || purchase.email;
  if (!sale || !owner || !purchase.seller_id || !purchase.product_id) throw new Error("incomplete verified purchase");
  return {
    transaction: crypto.createHash("sha256").update(`gumroad|${purchase.seller_id}|${sale}`).digest("hex"),
    owner: crypto.createHmac("sha256", process.env.GRANT_JWT_SECRET).update(`${purchase.seller_id}|${String(owner).trim().toLowerCase()}`).digest("hex"),
  };
}

export async function registerPurchase(purchase, grant) {
  const identity = purchaseIdentity(purchase);
  const record = {
    owner: identity.owner, product: purchase.product_id, grant, status: "unclaimed",
    fingerprint: crypto.createHash("sha256").update(JSON.stringify(grant)).digest("hex"),
    created_at: new Date().toISOString(),
  };
  const result = await ledgerCommand("register", identity.transaction, JSON.stringify(record));
  if (!result.ok) throw new Error(result.error);
  return identity;
}
