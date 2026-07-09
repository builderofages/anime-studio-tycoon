#!/usr/bin/env node
/**
 * Distribution setup wizard — checks env, Gumroad URLs, prints exact next steps.
 * Usage:
 *   node scripts/setup-distribution.mjs
 *   GUMROAD_ACCESS_TOKEN=xxx node scripts/setup-distribution.mjs --set-vercel
 */
import { spawnSync } from "child_process";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const base = process.env.PREFLIGHT_URL || "https://anime-studio-tycoon.vercel.app";
const setVercel = process.argv.includes("--set-vercel");

const MISSING = [
  { slug: "astlegend", name: "Legend Bundle", price: "7.99" },
  { slug: "astmogul", name: "Mogul Bundle", price: "19.99" },
  { slug: "astaurora", name: "Aurora Vesper", price: "3.99" },
  { slug: "astphoenix", name: "Phoenix Kogane", price: "3.99" },
  { slug: "astshogun", name: "Kaiser Shogun", price: "4.99" },
  { slug: "astitems", name: "Items Pack", price: "2.99" },
  { slug: "astnoads", name: "Remove Ads", price: "2.99" },
];

console.log("Anime Studio Tycoon — distribution setup\n");

let health = {};
try {
  const r = await fetch(`${base}/api/grant/health`);
  health = await r.json();
  console.log("Vercel production env:");
  console.log(`  GRANT_JWT_SECRET     ${health.grant_jwt ? "✓" : "✗"}`);
  console.log(`  GRANT_MINT_SECRET    ${health.grant_mint ? "✓" : "✗"}`);
  console.log(`  GUMROAD_ACCESS_TOKEN ${health.gumroad_token ? "✓" : "✗"}`);
  console.log(`  GUMROAD_SELLER_ID    ${health.gumroad_seller ? "✓" : "✗"}`);
  console.log(`  APPLE_SHARED_SECRET  ${health.apple_shared_secret ? "✓" : "✗"}`);
} catch (e) {
  console.error("  ✗ Could not reach /api/grant/health — deploy latest build first");
}

const token = process.env.GUMROAD_ACCESS_TOKEN;
if (setVercel && token) {
  console.log("\nSetting Vercel env (requires logged-in vercel CLI)...");
  for (const name of ["GUMROAD_ACCESS_TOKEN"]) {
    const p = spawnSync("vercel", ["env", "add", name, "production"], {
      cwd: root,
      input: token + "\n",
      encoding: "utf8",
    });
    console.log(p.status === 0 ? `  ✓ ${name}` : `  ✗ ${name}: ${p.stderr || p.stdout}`);
  }
}

console.log("\nGumroad products:");
const missing = [];
for (const p of MISSING) {
  let live = false;
  try {
    const r = await fetch(`https://trainagent.gumroad.com/l/${p.slug}`, { redirect: "follow" });
    live = r.ok;
  } catch (_) {}
  const mark = live ? "✓" : "✗";
  console.log(`  ${mark} ${p.slug} — ${p.name} ($${p.price})`);
  if (!live) missing.push(p);
}

const redirect = (slug) =>
  `https://anime-studio-tycoon.vercel.app/api/grant/finish?permalink=${slug}&license_key={license_key}`;

if (missing.length) {
  console.log("\nCreate missing products → https://gumroad.com/products/new");
  console.log("Each: Digital · Generate license key · Redirect URL below\n");
  for (const p of missing) {
    const spec = readFileSync(join(root, "launch/GUMROAD_PRODUCTS.md"), "utf8");
    const idx = MISSING.findIndex((m) => m.slug === p.slug) + 1;
    const section = spec.split(`## ${idx}.`)[1]?.split("---")[0] || "";
    console.log(`── ${p.name} (${p.slug}) $${p.price}`);
    console.log(`   Redirect: ${redirect(p.slug)}`);
    if (section.trim()) console.log(section.trim().split("\n").slice(0, 6).map((l) => `   ${l}`).join("\n"));
    console.log("");
  }
}

if (!health.gumroad_token) {
  console.log("Add Gumroad token:");
  console.log("  1. Gumroad → Settings → Advanced → Generate access token");
  console.log("  2. GUMROAD_ACCESS_TOKEN=xxx node scripts/setup-distribution.mjs --set-vercel");
  console.log("  Or: vercel env add GUMROAD_ACCESS_TOKEN production");
}

if (!health.apple_shared_secret) {
  console.log("\nTestFlight IAP:");
  console.log("  App Store Connect → App → App Information → Shared Secret");
  console.log("  vercel env add APPLE_SHARED_SECRET production");
  console.log("  Codemagic → ios-release on main (launch/CODEMAGIC.md)");
}

const report = {
  at: new Date().toISOString(),
  health,
  missingSlugs: missing.map((m) => m.slug),
  distributionReady: missing.length === 0 && health.gumroad_token && health.apple_shared_secret,
};
writeFileSync(join(root, "launch/DISTRIBUTION_STATUS.json"), JSON.stringify(report, null, 2));
console.log("\nReport: launch/DISTRIBUTION_STATUS.json");

if (missing.length === 0 && health.gumroad_token) {
  console.log("\n✓ Gumroad distribution ready — run: npm run launch-readiness");
  process.exit(0);
}
process.exit(1);