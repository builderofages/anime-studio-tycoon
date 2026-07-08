#!/usr/bin/env node
/**
 * Prune ast-v5.css — keep canonical BUILD sections only.
 * Run: node scripts/prune-ast-v5.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const path = join(root, "ast-v5.css");
const src = readFileSync(path, "utf8");

const MARK = /\/\* ========== BUILD (\d+)[^*]*\*\/\n/g;
const KEEP = new Set([54, 63, 64, 66, 67, 68, 70, 71, 72]);

const parts = [];
let last = 0;
let m;
const markers = [];

while ((m = MARK.exec(src)) !== null) {
  markers.push({ build: Number(m[1]), start: m.index, headerEnd: m.index + m[0].length });
}

if (!markers.length) {
  console.error("No BUILD markers found");
  process.exit(1);
}

parts.push(src.slice(0, markers[0].start).trimEnd());

for (let i = 0; i < markers.length; i++) {
  const { build, headerEnd } = markers[i];
  const end = i + 1 < markers.length ? markers[i + 1].start : src.length;
  let chunk = src.slice(headerEnd, end).trimEnd();
  if (!KEEP.has(build)) continue;
  if (build === 70) {
    chunk = chunk
      .replace(/html\.hud-v3-active \.aaa-gl-card\.sel \{[\s\S]*?\}\n\n/g, "")
      .replace(/html\.hud-v3-active \.aaa-gl-card \{\n  transition:[\s\S]*?\}\n\n/g, "");
  }
  parts.push(`/* ========== BUILD ${build} (canonical) ========== */\n\n${chunk}`);
}

const BUILD73 = `
/* ========== BUILD 73 — CSS Prune ========== */
/* Dead BUILD 55–62, 65, 69 sections removed. Canon: 54,63,64,66–68,70–73 */

html.hud-v3-active .aaa-gl-card:not(.aaa-gl-page .aaa-gl-card) {
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease !important;
}
`.trim();

const out = parts.join("\n\n") + "\n\n" + BUILD73 + "\n";
const before = src.split("\n").length;
const after = out.split("\n").length;

writeFileSync(path, out);
console.log(`pruned ast-v5.css: ${before} → ${after} lines (−${before - after})`);