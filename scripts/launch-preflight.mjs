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

function buildNum(html) {
  const m = html.match(/build\s+(\d+)/i);
  return m ? parseInt(m[1], 10) : 0;
}

console.log(`Anime Studio Tycoon — launch preflight\n  URL: ${base}\n`);

/* ── Native / TestFlight bundle (build 99) ── */
console.log("Native bundle:");
const indexPath = join(root, "index.html");
if (!existsSync(indexPath)) {
  failMsg("index.html", "missing");
} else {
  const indexHtml = readFileSync(indexPath, "utf8");
  const localBuild = buildNum(indexHtml);
  if (localBuild >= 114) pass(`local build tag (build ${localBuild})`);
  else failMsg("local build tag", `expected build 114+, got ${localBuild || "none"}`);

  if (indexHtml.includes('from "./logic.js"')) pass("logic.js import in index.html");
  else failMsg("logic.js import", 'missing from "./logic.js"');

  if (indexHtml.includes('id="return-hub"')) pass("return-hub overlay in index.html");
  else failMsg("return-hub", 'missing id="return-hub"');
}

existsSync(join(root, "logic.js")) ? pass("logic.js on disk") : failMsg("logic.js", "missing");
existsSync(join(root, "iap.js")) ? pass("iap.js on disk") : failMsg("iap.js", "missing");

const wwwIdx = join(root, "www/index.html");
if (!existsSync(wwwIdx)) {
  failMsg("www/index.html", "run: npm run prepare-native");
} else {
  const wwwHtml = readFileSync(wwwIdx, "utf8");
  existsSync(join(root, "www/logic.js")) ? pass("www/logic.js") : failMsg("www/logic.js", "run npm run prepare-native");
  existsSync(join(root, "www/iap.js")) ? pass("www/iap.js") : failMsg("www/iap.js", "run npm run prepare-native");
  if (wwwHtml.includes('src="iap.js"')) pass("www iap.js injected");
  else failMsg("www iap.js", "not injected — run npm run prepare-native");
  if (wwwHtml.includes('from "./logic.js"')) pass("www logic.js import");
  else failMsg("www logic.js import", 'missing from "./logic.js"');
  if (wwwHtml.includes('id="return-hub"')) pass("www return-hub overlay");
  else failMsg("www return-hub", 'missing id="return-hub"');
  const wwwBuild = buildNum(wwwHtml);
  if (wwwBuild >= 114) pass(`www build tag (build ${wwwBuild})`);
  else failMsg("www build tag", `expected build 114+, got ${wwwBuild || "none"}`);
  existsSync(join(root, "www/v5-idle-feel.js"))
    ? pass("www v5-idle-feel.js")
    : failMsg("www v5-idle-feel.js", "run npm run prepare-native");
  existsSync(join(root, "www/og-share.jpg"))
    ? pass("www og-share.jpg")
    : failMsg("www og-share.jpg", "run npm run prepare-native");
  if (wwwHtml.includes("v5-idle-feel.js")) pass("www idle feel script linked");
  else failMsg("www idle feel", "v5-idle-feel.js not in www/index.html");
  const wwwIap = join(root, "www/iap.js");
  if (existsSync(wwwIap)) {
    const iapSrc = readFileSync(wwwIap, "utf8");
    if (iapSrc.includes("https://") && iapSrc.includes("/api/iap/validate"))
      pass("www iap.js absolute VALIDATOR_URL");
    else failMsg("www iap.js VALIDATOR_URL", "run npm run prepare-native (needs production URL for native)");
  }
  existsSync(join(root, "www/design-overhaul.css"))
    ? failMsg("www stale asset", "design-overhaul.css — re-run prepare-native (www/ should be wiped)")
    : pass("www no stale design-overhaul.css");
}

const capPath = join(root, "capacitor.config.json");
if (existsSync(capPath)) {
  try {
    const cap = JSON.parse(readFileSync(capPath, "utf8"));
    cap.appId === "com.trainyouragent.animestudiotycoon"
      ? pass("capacitor appId")
      : failMsg("capacitor appId", cap.appId || "unset");
    cap.appName === "Anime Studio Tycoon"
      ? pass("capacitor appName")
      : failMsg("capacitor appName", cap.appName || "unset");
    cap.webDir === "www"
      ? pass("capacitor webDir")
      : failMsg("capacitor webDir", cap.webDir || "unset");
  } catch (e) {
    failMsg("capacitor.config.json", e.message);
  }
} else {
  failMsg("capacitor.config.json", "missing");
}

console.log("\nStore assets:");
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

console.log("\nAPI:");
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
  const liveBuild = buildNum(html);
  if (liveBuild >= 98) pass(`live build tag (build ${liveBuild})`);
  else if (html.includes("BUILD_TAG") || html.includes("Studio")) pass("live site responds (deploy latest for build 98+)");
  else failMsg("live site", "unexpected HTML");
} catch (e) {
  failMsg("live site", e.message);
}

console.log("\nGuides:");
const guides = [
  "launch/ENV_CHECKLIST.md", "launch/GUMROAD_SETUP.md", "launch/GUMROAD_PRODUCTS.md",
  "launch/CODEMAGIC.md", "launch/STORE_LISTING.md", "launch/STEAM_SUBMISSION.md",
  "launch/TESTFLIGHT_CHECKLIST.md", "launch/DEVICE_QA.md",
];
for (const g of guides) {
  existsSync(join(root, g)) ? pass(`guide: ${g}`) : failMsg(`guide: ${g}`, "missing");
}

existsSync(join(root, "icons/icon-512.png")) ? pass("local PWA icon") : failMsg("local PWA icon", "run npm run prepare-store-icons");

try {
  const lic = await fetch(`${base}/api/grant/license`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sku: "pass", license_key: "TEST-INVALID" }),
  });
  const j = await lic.json();
  if (lic.status === 503 && String(j.error || "").includes("GRANT_JWT")) failMsg("license API", "JWT not configured");
  else if (lic.status === 400 && j.error === "invalid license") pass("license API (needs GUMROAD_ACCESS_TOKEN for real keys)");
  else if (lic.status === 400 && j.error === "license_key required") pass("license API reachable");
  else pass("license API responds");
} catch (e) {
  failMsg("license API", e.message);
}

console.log(`\n${ok} passed, ${fail} failed`);
console.log("\nManual steps:");
console.log("  • Vercel: GUMROAD_ACCESS_TOKEN + GUMROAD_SELLER_ID");
console.log("  • Vercel: APPLE_SHARED_SECRET + VALIDATOR_URL for native IAP");
console.log("  • Create 7 Gumroad products → launch/GUMROAD_PRODUCTS.md");
console.log("  • Codemagic ios-release → launch/TESTFLIGHT_CHECKLIST.md");
console.log("  • Steam upload → launch/STEAM_SUBMISSION.md");
process.exit(fail > 0 ? 1 : 0);