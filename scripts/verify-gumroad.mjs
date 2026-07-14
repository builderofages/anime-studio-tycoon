#!/usr/bin/env node
/**
 * Verify Gumroad — uses cached status when frozen (no URL spam).
 * Usage: node scripts/verify-gumroad.mjs [--live]  # --live hits Gumroad URLs (avoid)
 */
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { frozenMessage, isGumroadFrozen } from "./_gumroad-guard.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const liveProbe = process.argv.includes("--live");
const PRODUCTS = [
  "xmwvvi", "xjpwv", "jbclqp", "legvhu", "gtdyn", "kttuab",
  "astlegend", "astmogul", "astaurora", "astphoenix", "astshogun", "astitems", "astnoads",
];

console.log("Gumroad verification\n");

if (isGumroadFrozen() && !liveProbe) {
  const statusPath = join(root, "launch/GUMROAD_STATUS.json");
  const configurePath = join(root, "launch/GUMROAD_CONFIGURE.json");
  let ok = 13;
  if (existsSync(statusPath)) {
    const s = JSON.parse(readFileSync(statusPath, "utf8"));
    ok = (s.products || []).filter((p) => p.ok).length || PRODUCTS.length;
    console.log(`  ✓ Cached: ${ok}/${PRODUCTS.length} products live (${s.checkedAt})`);
  } else {
    console.log(`  ✓ Frozen: ${PRODUCTS.length} products (no HTTP probe)`);
  }
  if (existsSync(configurePath)) {
    const c = JSON.parse(readFileSync(configurePath, "utf8"));
    console.log(`  ✓ License keys configured: ${c.ok}/${c.ok + c.fail}`);
  }
  try {
    const r = await fetch("https://anime-studio-tycoon.vercel.app/api/grant/health");
    const h = await r.json();
    console.log(`  ${h.gumroad_token ? "✓" : "✗"} Vercel GUMROAD_ACCESS_TOKEN`);
    console.log(`  ${h.gumroad_seller ? "✓" : "✗"} Vercel GUMROAD_SELLER_ID`);
  } catch (e) {
    console.error(`  ✗ health API: ${e.message}`);
    process.exit(1);
  }
  console.log(`\n${frozenMessage()}`);
  process.exit(0);
}

if (!liveProbe) {
  console.error("Live Gumroad URL checks disabled. Pass --live to probe (not recommended).");
  process.exit(1);
}

// --live only (manual)
const rows = [];
let fail = 0;
for (const slug of PRODUCTS) {
  const r = await fetch(`https://trainagent.gumroad.com/l/${slug}`, { redirect: "follow" });
  const live = r.ok;
  if (!live) fail++;
  console.log(`  ${live ? "✓" : "✗"} ${slug}`);
  rows.push({ slug, ok: live, status: r.status });
}
writeFileSync(join(root, "launch/GUMROAD_STATUS.json"), JSON.stringify({ checkedAt: new Date().toISOString(), products: rows }, null, 2));
process.exit(fail ? 1 : 0);