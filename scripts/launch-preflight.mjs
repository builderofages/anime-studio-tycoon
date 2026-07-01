#!/usr/bin/env node
/**
 * Pre-launch checks — run before store submit.
 * Usage: node scripts/launch-preflight.mjs [--url https://anime-studio-tycoon.vercel.app]
 */
import { existsSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const base = (process.argv.find((a) => a.startsWith("--url="))?.split("=")[1])
  || process.env.PREFLIGHT_URL
  || "https://anime-studio-tycoon.vercel.app";

let ok = 0;
let fail = 0;

function pass(name) { ok++; console.log(`  ✓ ${name}`); }
function failMsg(name, msg) { fail++; console.error(`  ✗ ${name}: ${msg}`); }

console.log(`Anime Studio Tycoon — launch preflight\n  URL: ${base}\n`);

const assets = ["app-icon.png", "steam-capsule.jpg", "screenshot-produce.png", "screenshot-stars.png"];
for (const f of assets) {
  existsSync(join(root, "launch/store", f)) ? pass(`asset: ${f}`) : failMsg(`asset: ${f}`, "missing");
}

const dmg = join(root, "desktop/dist");
if (existsSync(dmg)) {
  pass("desktop/dist exists");
} else {
  failMsg("desktop/dist", "run: cd desktop && npm run dist:mac");
}

try {
  const r = await fetch(`${base}/api/grant/redeem?pt=bad`);
  const j = await r.json();
  if (r.status === 400 && j.error) pass("API grant/redeem (env configured)");
  else if (r.status === 503) failMsg("API grant/redeem", "GRANT_JWT_SECRET not set on Vercel — run npm run gen-env-secrets");
  else failMsg("API grant/redeem", `unexpected ${r.status}`);
} catch (e) {
  failMsg("API grant/redeem", e.message);
}

try {
  const r = await fetch(base);
  const html = await r.text();
  if (html.includes("build 23")) pass("live build tag");
  else if (html.includes("BUILD_TAG") || html.includes("Studio")) pass("live site responds");
  else failMsg("live site", "unexpected HTML");
} catch (e) {
  failMsg("live site", e.message);
}

const guides = ["launch/ENV_CHECKLIST.md", "launch/GUMROAD_SETUP.md", "launch/CODEMAGIC.md", "launch/STORE_LISTING.md"];
for (const g of guides) {
  existsSync(join(root, g)) ? pass(`guide: ${g}`) : failMsg(`guide: ${g}`, "missing");
}

console.log(`\n${ok} passed, ${fail} failed`);
if (fail) {
  console.log("\nStill needed:");
  console.log("  • GUMROAD_ACCESS_TOKEN + GUMROAD_SELLER_ID on Vercel");
  console.log("  • Create 7 Gumroad products (launch/ENV_CHECKLIST.md)");
  console.log("  • Codemagic ios-release trigger (launch/CODEMAGIC.md)");
}
process.exit(fail > 0 ? 1 : 0);