#!/usr/bin/env node
/** Slice 8-tab HF sprite into icons/tabs/{produce,quests,...}.png */
import { existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sheet = process.argv[2] || join(root, "launch/generated/tab-icons.png");
const outDir = join(root, "icons/tabs");
const names = ["produce", "quests", "staff", "stars", "research", "studio", "market", "store"];

if (!existsSync(sheet)) {
  console.error("missing:", sheet);
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });

const { default: sharp } = await import("sharp").catch(() => ({ default: null }));
if (!sharp) {
  console.error("npm i -D sharp");
  process.exit(1);
}

const meta = await sharp(sheet).metadata();
const w = meta.width;
const h = meta.height;
const size = Math.min(Math.floor(w / 8), h);

for (let i = 0; i < names.length; i++) {
  const cx = Math.floor((i + 0.5) * w / 8);
  const left = Math.max(0, cx - Math.floor(size / 2));
  const top = Math.max(0, Math.floor(h / 2) - Math.floor(size / 2));
  const dest = join(outDir, `${names[i]}.png`);
  await sharp(sheet)
    .extract({ left, top, width: size, height: size })
    .resize(64, 64)
    .png()
    .toFile(dest);
  console.log("saved", dest);
}