#!/usr/bin/env node
import assert from "node:assert/strict";
import { mintFromPurchase } from "../api/grant/_mint.js";
import { verifyGrant } from "../api/grant/_jwt.js";

// Fake credentials and intercepted fetch keep all purchase verification local.
const keys = ["GRANT_JWT_SECRET", "GUMROAD_ACCESS_TOKEN", "GUMROAD_SKIP_LICENSE_VERIFY", "NODE_ENV", "GUMROAD_SELLER_ID", "GUMROAD_PRODUCT_IDS_JSON", "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"];
const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
const originalFetch = globalThis.fetch;
const calls = [];
let response = { success: false };
globalThis.fetch = async (url, options) => {
  if (String(url).includes("ledger.test")) return {ok:true,json:async()=>({result:JSON.stringify({ok:true})})};
  assert.equal(url, "https://api.gumroad.com/v2/licenses/verify");
  calls.push(options);
  return { ok:true, json: async () => response };
};
try {
  process.env.GRANT_JWT_SECRET = "test-only-grant-signing-secret";
  process.env.GUMROAD_ACCESS_TOKEN = "test-only-gumroad-access-token";
  process.env.GUMROAD_SELLER_ID="seller";
  process.env.GUMROAD_PRODUCT_IDS_JSON=JSON.stringify({jbclqp:"product"});
  process.env.UPSTASH_REDIS_REST_URL="https://ledger.test";
  process.env.UPSTASH_REDIS_REST_TOKEN="fake";
  process.env.GUMROAD_SKIP_LICENSE_VERIFY = "true";
  for (const environment of ["production", "development", "test", undefined]) {
    if (environment === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = environment;
    const before = calls.length;
    const rejected = await mintFromPurchase({ sku: "gems_s", licenseKey: "fake-license" });
    assert.equal(rejected.ok, false, "old skip flag cannot mint an unverified purchase");
    assert.equal(rejected.pt, undefined);
    assert.equal(calls.length, before + 1, "Gumroad verification always runs");
  }

  response = { success: true, purchase: { refunded: false, sale_id:"sale", seller_id:"seller", product_id:"product", purchaser_id:"buyer" } };
  const granted = await mintFromPurchase({ sku: "gems_s", licenseKey: " fake-license " });
  assert.equal(granted.ok, true, "verified purchases still mint signed grants");
  const payload = verifyGrant(granted.pt, process.env.GRANT_JWT_SECRET);
  assert.equal(payload.kind, "gems");
  assert.equal(payload.amount, 120);
  const request = calls.at(-1);
  assert.equal(request.method, "POST");
  const body = new URLSearchParams(request.body);
  assert.equal(body.get("product_id"), "product");
  assert.equal(body.get("license_key"), "fake-license");
  assert.equal(body.get("increment_uses_count"), "false");
  const repeat = await mintFromPurchase({ permalink: "jbclqp", licenseKey: "fake-license" });
  assert.equal(verifyGrant(repeat.pt, process.env.GRANT_JWT_SECRET).gid, payload.gid);

  const goodPurchase = {...response.purchase};
  for (const bad of [{seller_id:"other"},{product_id:"other"},{chargebacked:true},{disputed:true}]) {
    response={success:true,purchase:{...goodPurchase,...bad}};
    assert.equal((await mintFromPurchase({sku:"gems_s",licenseKey:"fake-license"})).ok,false,"wrong identity or disputed payment is rejected");
  }
  response = { success: true, purchase: { refunded: true } };
  assert.equal((await mintFromPurchase({ sku: "gems_s", licenseKey: "fake-license" })).ok, false);
  delete process.env.GUMROAD_ACCESS_TOKEN;
  const before = calls.length;
  assert.equal((await mintFromPurchase({ sku: "gems_s", licenseKey: "fake-license" })).ok, false);
  assert.equal(calls.length, before, "missing credentials fail without network calls");
  assert.equal((await mintFromPurchase({ sku: "gems_s", licenseKey: "" })).ok, false);
  console.log("Grant mint regressions passed: bypass rejection, verified purchase, refund and missing-credential rejection.");
} finally {
  globalThis.fetch = originalFetch;
  for (const key of keys) {
    if (previous[key] === undefined) delete process.env[key];
    else process.env[key] = previous[key];
  }
}
