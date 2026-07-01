#!/usr/bin/env node
/**
 * Copy app icon into iOS asset catalog + www for PWA/manifest.
 * Run: node scripts/prepare-store-icons.mjs
 */
import { cpSync, mkdirSync, existsSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "launch/store/app-icon.png");
if (!existsSync(src)) {
  console.error("Missing launch/store/app-icon.png — run npm run fetch-launch-assets");
  process.exit(1);
}

const wwwAssets = join(root, "www/assets");
const iconsDir = join(root, "icons");
mkdirSync(wwwAssets, { recursive: true });
mkdirSync(iconsDir, { recursive: true });
cpSync(src, join(wwwAssets, "app-icon.png"));
cpSync(src, join(iconsDir, "icon-512.png"));
console.log("copied → www/assets/app-icon.png, icons/icon-512.png");

const manifestPath = join(root, "manifest.json");
if (existsSync(manifestPath)) {
  const m = JSON.parse(readFileSync(manifestPath, "utf8"));
  m.icons = [
    { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
    { src: "/icons/icon-512.png", sizes: "1024x1024", type: "image/png", purpose: "any maskable" },
  ];
  writeFileSync(manifestPath, JSON.stringify(m, null, 2) + "\n");
  writeFileSync(join(root, "www/manifest.json"), JSON.stringify(m, null, 2) + "\n");
  console.log("updated manifest.json icons → local /icons/");
}

const iosIcon = join(root, "ios/App/App/Assets.xcassets/AppIcon.appiconset");
if (existsSync(iosIcon)) {
  const out1024 = join(iosIcon, "AppIcon-512@2x.png");
  const r = spawnSync("sips", ["-z", "1024", "1024", src, "--out", out1024], { encoding: "utf8" });
  if (r.status === 0) console.log("ios AppIcon-512@2x.png (1024)");
}

console.log("Store icons ready.");