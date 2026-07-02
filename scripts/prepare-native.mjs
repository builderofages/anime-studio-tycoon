#!/usr/bin/env node
/**
 * Assemble www/ for Capacitor native builds from repo source.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const ROOT = new URL("..", import.meta.url).pathname;
const WWW = join(ROOT, "www");

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
  "studio-premium.css",
  "game-skin.css",
  "hf-design.css",
  "aaa-ui.css",
  "bg-v4.png",
  "design-ref-v4.png",
  "start-hero.png",
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

const idx = join(WWW, "index.html");
if (existsSync(idx)) {
  let html = readFileSync(idx, "utf8");
  if (!html.includes('src="iap.js"')) {
    html = html.replace("</body>", '<script src="iap.js"></script>\n</body>');
    writeFileSync(idx, html);
    console.log("injected iap.js into www/index.html");
  }
}

console.log("www/ ready for cap sync");