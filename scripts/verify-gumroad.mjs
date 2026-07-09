#!/usr/bin/env node
/**
 * Verify Gumroad product URLs + optional license API when GUMROAD_ACCESS_TOKEN is set.
 * Usage: GUMROAD_ACCESS_TOKEN=xxx node scripts/verify-gumroad.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const REDIRECT = "https://anime-studio-tycoon.vercel.app/api/grant/finish?permalink=SLUG&license_key={license_key}";

const PRODUCTS = [
  { slug: "xmwvvi", name: "Producer Pass", price: 4.99, live: true },
  { slug: "xjpwv", name: "Starter Bundle", price: 9.99, live: true },
  { slug: "jbclqp", name: "Gems 120", price: 1.99, live: true },
  { slug: "legvhu", name: "Gems 350", price: 4.99, live: true },
  { slug: "gtdyn", name: "Gems 800", price: 9.99, live: true },
  { slug: "kttuab", name: "Gems 2000", price: 19.99, live: true },
  { slug: "astlegend", name: "Legend Bundle", price: 7.99, spec: "launch/GUMROAD_PRODUCTS.md §1" },
  { slug: "astmogul", name: "Mogul Bundle", price: 19.99, spec: "§2" },
  { slug: "astaurora", name: "Aurora Vesper", price: 3.99, spec: "§3" },
  { slug: "astphoenix", name: "Phoenix Kogane", price: 3.99, spec: "§4" },
  { slug: "astshogun", name: "Kaiser Shogun", price: 4.99, spec: "§5" },
  { slug: "astitems", name: "Items Pack", price: 2.99, spec: "§6" },
  { slug: "astnoads", name: "Remove Ads", price: 2.99, spec: "§7" },
];

let ok = 0;
let fail = 0;
const rows = [];

console.log("Gumroad product verification (trainagent.gumroad.com)\n");

for (const p of PRODUCTS) {
  let status = 0;
  try {
    const r = await fetch(`https://trainagent.gumroad.com/l/${p.slug}`, { redirect: "follow" });
    status = r.status;
  } catch (e) {
    status = 0;
    rows.push({ ...p, status, ok: false, error: e.message });
    fail++;
    console.error(`  ✗ ${p.slug} — ${e.message}`);
    continue;
  }
  const live = status === 200;
  if (live) {
    ok++;
    console.log(`  ✓ ${p.slug} — live`);
  } else {
    fail++;
    console.error(`  ✗ ${p.slug} — HTTP ${status} (create: ${p.spec || "existing"})`);
    if (!p.live) {
      const redirect = REDIRECT.replace("SLUG", p.slug);
      console.error(`      Redirect: ${redirect}`);
    }
  }
  rows.push({ ...p, status, ok: live });
}

const token = process.env.GUMROAD_ACCESS_TOKEN;
if (token) {
  try {
    const r = await fetch(`https://api.gumroad.com/v2/licenses/verify?access_token=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "product_permalink=xmwvvi&license_key=INVALID-TEST-KEY",
    });
    const j = await r.json();
    if (j.success === false) {
      ok++;
      console.log("  ✓ GUMROAD_ACCESS_TOKEN valid (license verify API responds)");
    } else {
      fail++;
      console.error("  ✗ GUMROAD_ACCESS_TOKEN unexpected verify response");
    }
  } catch (e) {
    fail++;
    console.error(`  ✗ GUMROAD_ACCESS_TOKEN API: ${e.message}`);
  }
} else {
  console.log("\n  ℹ Set GUMROAD_ACCESS_TOKEN to verify API + add to Vercel:");
  console.log("    vercel env add GUMROAD_ACCESS_TOKEN production");
  console.log("    vercel env add GUMROAD_SELLER_ID production");
}

const missing = rows.filter((r) => !r.ok).map((r) => r.slug);
const report = { checkedAt: new Date().toISOString(), live: ok, missing, products: rows };
writeFileSync(join(root, "launch/GUMROAD_STATUS.json"), JSON.stringify(report, null, 2));

console.log(`\n${rows.filter((r) => r.ok).length}/${PRODUCTS.length} products live`);
if (missing.length) {
  console.log(`Missing: ${missing.join(", ")}`);
  console.log("Create at https://gumroad.com/products/new — specs: launch/GUMROAD_PRODUCTS.md");
}
process.exit(missing.length ? 1 : 0);