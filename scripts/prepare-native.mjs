#!/usr/bin/env node
/**
 * Assemble www/ for Capacitor native builds from repo source.
 *
 * iOS privacy strings (ios/App/App/Info.plist) — add after `npx cap add ios`:
 *   No camera, microphone, location, contacts, or tracking SDKs (privacy.html: local save only).
 *   Optional IAP: no extra usage string beyond StoreKit.
 *   If you add analytics later, set NSUserTrackingUsageDescription before enabling ATT.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, rmSync } from "fs";
import { join } from "path";

const ROOT = new URL("..", import.meta.url).pathname;
const WWW = join(ROOT, "www");
const VALIDATOR_URL =
  process.env.VALIDATOR_URL || "https://anime-studio-tycoon.vercel.app/api/iap/validate";

const FILES = [
  "index.html",
  "strings.js",
  "logic.js",
  "iap.js",
  "aaa-upgrade.js",
  "aaa-upgrade.css",
  "gameplay-plus.js",
  "gameplay-plus.css",
  "gameplay-ultra.js",
  "gameplay-ultra.css",
  "gameplay-endless.js",
  "gameplay-endless.css",
  "gameplay-empire.js",
  "gameplay-empire.css",
  "gameplay-studio.js",
  "gameplay-studio.css",
  "gameplay-final.js",
  "gameplay-final.css",
  "gameplay-aaa.js",
  "gameplay-aaa.css",
  "gameplay-legend.js",
  "gameplay-legend.css",
  "hud-premium.js",
  "hud-premium.css",
  "ui-complete.js",
  "ui-complete.css",
  "gameplay-studio-rating.js",
  "gameplay-studio-rating.css",
  "hook-bridge.js",
  "gameplay-polish.js",
  "v5-slim-gate.js",
  "v5-render-guard.js",
  "v5-idle-feel.js",
  "studio-premium.css",
  "game-skin.css",
  "hf-design.css",
  "aaa-ui.css",
  "legacy-fx.css",
  "ast-v5.css",
  "bg-v4.png",
  "design-ref-v4.png",
  "start-hero.png",
  "og-share.jpg",
  "play.html",
  "robots.txt",
  "sitemap.xml",
  "assets/hf/gacha-bg.png",
  "assets/hf/greenlight-bg.png",
  "manifest.json",
  "icons/icon-512.png",
  "icons/hf/yen.png",
  "icons/hf/fans.png",
  "icons/hf/hype.png",
  "icons/hf/gems.png",
  "icons/tabs/produce.png",
  "icons/tabs/quests.png",
  "icons/tabs/staff.png",
  "icons/tabs/stars.png",
  "icons/tabs/research.png",
  "icons/tabs/studio.png",
  "icons/tabs/market.png",
  "icons/tabs/store.png",
  "privacy.html",
  "terms.html",
];

if (existsSync(WWW)) rmSync(WWW, { recursive: true, force: true });
mkdirSync(WWW, { recursive: true });

for (const f of FILES) {
  const src = join(ROOT, f);
  if (!existsSync(src)) {
    console.warn(`skip missing: ${f}`);
    continue;
  }
  cpSync(src, join(WWW, f));
  console.log(`copied ${f}`);
}

const audioDir = join(ROOT, "audio");
if (existsSync(audioDir)) {
  mkdirSync(join(WWW, "audio"), { recursive: true });
  for (const name of readdirSync(audioDir)) {
    const src = join(audioDir, name);
    if (!name.match(/\.(wav|mp3|m4a|ogg)$/i)) continue;
    cpSync(src, join(WWW, "audio", name));
    console.log(`copied audio/${name}`);
  }
}

const idx = join(WWW, "index.html");
if (existsSync(idx)) {
  let html = readFileSync(idx, "utf8");
  if (!html.includes('src="iap.js"')) {
    html = html.replace("</body>", '<script src="iap.js"></script>\n</body>');
    writeFileSync(idx, html);
    console.log("injected iap.js into www/index.html");
  }
}

const iapPath = join(WWW, "iap.js");
if (existsSync(iapPath)) {
  let iap = readFileSync(iapPath, "utf8");
  const injected = `var VALIDATOR_URL = "${VALIDATOR_URL}";`;
  if (!iap.includes(injected)) {
    iap = iap.replace('var VALIDATOR_URL = "/api/iap/validate";', injected);
    writeFileSync(iapPath, iap);
    console.log(`injected VALIDATOR_URL into www/iap.js → ${VALIDATOR_URL}`);
  }
}

console.log("www/ ready for cap sync");