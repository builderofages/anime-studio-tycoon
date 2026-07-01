#!/usr/bin/env node
/**
 * Download existing Higgsfield CDN art into launch/store/ (no CLI auth needed).
 * Run: node scripts/fetch-launch-assets.mjs
 */
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const CDN = "https://d8j0ntlcm91z4.cloudfront.net/user_342M7OMJEmtQi5ZXBKPVqJZUjCn/";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "launch/store");
mkdirSync(outDir, { recursive: true });

const ASSETS = {
  "app-icon.png": "hf_20260615_090332_3e1dbb67-bab0-488a-abd4-5c9b12bc2740.png",
  "steam-capsule.jpg": "hf_20260614_062706_8cb8f42c-84b2-45b0-8c27-96e8ffc01bb7.jpeg",
  "screenshot-produce.png": "hf_20260615_183520_5f614e0c-17ed-4762-9e20-dd33a0ee5546.png",
  "screenshot-stars.png": "hf_20260618_054255_9ff5fbbe-0d2e-43f8-b099-cba0d82252b4.png",
  "trailer-keyframe.jpg": "hf_20260615_183556_a9b8c0f1-0aba-4f05-b1b9-eb889227c5b1.png",
};

async function download(name, key) {
  const url = CDN + key;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(join(outDir, name), buf);
  console.log(`✓ ${name} (${buf.length} bytes)`);
  return { name, url, bytes: buf.length };
}

const manifest = { source: "cdn-fallback", generated: new Date().toISOString(), assets: [] };
for (const [name, key] of Object.entries(ASSETS)) {
  try {
    manifest.assets.push(await download(name, key));
  } catch (e) {
    console.error(`✗ ${name}:`, e.message);
    manifest.assets.push({ name, key, error: e.message });
  }
}
writeFileSync(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`\nSaved to launch/store/ (${manifest.assets.length} files)`);