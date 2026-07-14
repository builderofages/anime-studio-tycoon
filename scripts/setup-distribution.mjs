#!/usr/bin/env node
/**
 * Distribution status — NO Gumroad browser, NO CLI auth, NO URL loops.
 */
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { frozenMessage, isGumroadFrozen } from "./_gumroad-guard.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const base = process.env.PREFLIGHT_URL || "https://anime-studio-tycoon.vercel.app";

console.log("Anime Studio Tycoon — distribution status\n");

let health = {};
try {
  const r = await fetch(`${base}/api/grant/health`);
  health = await r.json();
  console.log("Production (Vercel):");
  console.log(`  Play URL             ${base}/play`);
  console.log(`  GRANT_JWT_SECRET     ${health.grant_jwt ? "✓" : "✗"}`);
  console.log(`  GRANT_MINT_SECRET    ${health.grant_mint ? "✓" : "✗"}`);
  console.log(`  GUMROAD_ACCESS_TOKEN ${health.gumroad_token ? "✓" : "✗"}`);
  console.log(`  GUMROAD_SELLER_ID    ${health.gumroad_seller ? "✓" : "✗"}`);
  console.log(`  APPLE_SHARED_SECRET  ${health.apple_shared_secret ? "✓" : "✗"}`);
} catch (e) {
  console.error("  ✗ Could not reach /api/grant/health");
  process.exit(1);
}

if (isGumroadFrozen()) {
  console.log(`\n${frozenMessage()}`);
}

const gumroadOk = health.gumroad_token && health.gumroad_seller;
if (gumroadOk) {
  console.log("\n✓ Web monetization (Gumroad) — live");
  console.log("  Store: https://trainagent.gumroad.com");
} else {
  console.log("\n✗ Gumroad env missing on Vercel — set in dashboard (scripts will not open browser)");
}

if (!health.apple_shared_secret) {
  console.log("\nNext for mobile (TestFlight):");
  console.log("  1. App Store Connect → Shared Secret → vercel env add APPLE_SHARED_SECRET production");
  console.log("  2. Codemagic → ios-release (launch/CODEMAGIC.md)");
  console.log("  3. Physical QA: launch/DEVICE_QA.md");
}

const report = {
  at: new Date().toISOString(),
  health,
  playUrl: `${base}/play`,
  gumroadFrozen: isGumroadFrozen(),
  webLive: health.grant_jwt && health.grant_mint,
  gumroadReady: gumroadOk,
  mobileReady: !!health.apple_shared_secret,
};
writeFileSync(join(root, "launch/DISTRIBUTION_STATUS.json"), JSON.stringify(report, null, 2));
console.log("\nReport: launch/DISTRIBUTION_STATUS.json");

process.exit(gumroadOk && health.grant_jwt ? 0 : 1);