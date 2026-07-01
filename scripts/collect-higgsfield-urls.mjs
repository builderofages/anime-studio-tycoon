#!/usr/bin/env node
/**
 * Parse Higgsfield CLI logs and download generated assets to launch/store/
 * Usage: node scripts/collect-higgsfield-urls.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const genDir = join(root, "launch/generated");
const outDir = join(root, "launch/store");
mkdirSync(outDir, { recursive: true });

const MAP = {
  "app-icon.log": "app-icon.png",
  "steam-capsule.log": "steam-capsule.png",
  "screenshot-produce.log": "screenshot-produce.png",
  "screenshot-stars.log": "screenshot-stars.png",
  "trailer-keyframe.log": "trailer-keyframe.png",
  "trailer-clip.log": "trailer-clip.mp4",
};

const urlRe = /https?:\/\/[^\s"'<>]+\.(?:png|jpe?g|webp|mp4|mov)/gi;

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(dest, buf);
  console.log(`saved ${dest} (${buf.length} bytes)`);
}

const manifest = { generated: new Date().toISOString(), assets: [] };

for (const [log, filename] of Object.entries(MAP)) {
  const path = join(genDir, log);
  if (!existsSync(path)) {
    console.warn(`skip missing log: ${log}`);
    continue;
  }
  const text = readFileSync(path, "utf8");
  const urls = [...new Set(text.match(urlRe) || [])];
  if (!urls.length) {
    console.warn(`no URL in ${log}`);
    continue;
  }
  const url = urls[urls.length - 1];
  const dest = join(outDir, filename);
  try {
    await download(url, dest);
    manifest.assets.push({ name: filename, url, log });
  } catch (e) {
    console.error(`failed ${filename}:`, e.message);
    manifest.assets.push({ name: filename, url, log, error: e.message });
  }
}

writeFileSync(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`\nDone — ${manifest.assets.length} assets tracked in launch/store/manifest.json`);