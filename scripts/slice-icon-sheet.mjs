#!/usr/bin/env node
/** Slice a 4-icon horizontal HF sprite sheet into icons/hf/{yen,fans,hype,gems}.png */
import { existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sheet = process.argv[2] || join(root, "launch/generated/icons-sheet.png");
const outDir = join(root, "icons/hf");
const names = ["yen", "fans", "hype", "gems"];

if (!existsSync(sheet)) {
  console.error("missing sheet:", sheet);
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });

const { default: sharp } = await import("sharp").catch(() => ({ default: null }));
if (!sharp) {
  console.error("install sharp: npm i -D sharp");
  process.exit(1);
}

const meta = await sharp(sheet).metadata();
const w = meta.width;
const h = meta.height;
const size = Math.min(Math.floor(w / 4), h);

for (let i = 0; i < names.length; i++) {
  const cx = Math.floor((i + 0.5) * w / 4);
  const left = Math.max(0, cx - Math.floor(size / 2));
  const top = Math.max(0, Math.floor(h / 2) - Math.floor(size / 2));
  const dest = join(outDir, `${names[i]}.png`);
  await sharp(sheet)
    .extract({ left, top, width: size, height: size })
    .resize(128, 128)
    .png()
    .toFile(dest);
  console.log("saved", dest);
}