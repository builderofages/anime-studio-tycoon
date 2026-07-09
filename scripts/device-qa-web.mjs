#!/usr/bin/env node
/**
 * Automated web device QA — curl/fetch checks against production (or --url=).
 * Covers automatable sections from launch/DEVICE_QA.md.
 */
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const base = process.argv.find((a) => a.startsWith("--url="))?.split("=")[1]
  || process.env.PREFLIGHT_URL
  || "https://anime-studio-tycoon.vercel.app";

let passed = 0;
let failed = 0;
const results = [];

function ok(name, detail = "") {
  passed++;
  results.push({ check: name, pass: true, detail });
  console.log(`  ✓ ${name}${detail ? ` — ${detail}` : ""}`);
}
function fail(name, msg) {
  failed++;
  results.push({ check: name, pass: false, detail: msg });
  console.error(`  ✗ ${name}: ${msg}`);
}
function assert(cond, name, msg) {
  if (cond) ok(name);
  else fail(name, msg);
}

function buildNum(html) {
  const m = html.match(/build\s+(\d+)/i);
  return m ? parseInt(m[1], 10) : 0;
}

console.log(`Anime Studio Tycoon — automated web device QA\n  URL: ${base}/play\n`);

let playHtml = "";
try {
  const r = await fetch(`${base}/play`, { redirect: "follow" });
  playHtml = await r.text();
  assert(r.ok, "cold launch /play HTTP 200", `status ${r.status}`);
  assert(playHtml.includes("btn-start-play"), "start screen Play CTA present");
  assert(playHtml.includes("BUILD_TAG"), "game script loads");
} catch (e) {
  fail("cold launch /play", e.message);
}

const liveBuild = buildNum(playHtml);
assert(liveBuild >= 117, "build tag 117+ on live site", `got build ${liveBuild || "none"}`);
assert(playHtml.includes("build 117") || playHtml.includes("build 118") || liveBuild >= 117, "footer build tag visible");

const localHtml = readFileSync(join(root, "index.html"), "utf8");
assert(localHtml.includes('tf("hub_welcome"'), "return hub i18n wired");
assert(localHtml.includes('t("prem_first_ribbon")'), "premiere i18n wired");
assert(readFileSync(join(root, "strings.js"), "utf8").includes("const UI6"), "UI6 hub/market i18n batch");

try {
  const og = await fetch(`${base}/og-share.jpg`, { method: "HEAD" });
  const ct = og.headers.get("content-type") || "";
  assert(og.ok, "OG share image 200", `status ${og.status}`);
  assert(ct.includes("image"), "OG share content-type image", ct);
} catch (e) {
  fail("OG share image", e.message);
}

try {
  const man = await fetch(`${base}/manifest.json`);
  const mj = await man.json();
  assert(man.ok, "manifest.json 200");
  assert(mj.start_url === "/play" || mj.id === "/play", "manifest start_url /play");
} catch (e) {
  fail("manifest.json", e.message);
}

const astCss = readFileSync(join(root, "ast-v5.css"), "utf8");
assert(astCss.includes("100dvh"), "iOS viewport 100dvh in CSS");
assert(astCss.includes("-webkit-fill-available") || astCss.includes("safe-area"), "iOS safe-area CSS");

try {
  const r = await fetch(`${base}/api/grant/redeem?pt=bad`);
  const j = await r.json();
  assert(r.status === 400 && j.error, "grant API configured");
} catch (e) {
  fail("grant API", e.message);
}

const gumroadSlugs = ["xmwvvi", "xjpwv", "jbclqp", "legvhu", "gtdyn", "kttuab"];
let gumLive = 0;
for (const slug of gumroadSlugs) {
  try {
    const r = await fetch(`https://trainagent.gumroad.com/l/${slug}`, { method: "HEAD", redirect: "follow" });
    if (r.ok) gumLive++;
  } catch (_) {}
}
assert(gumLive === gumroadSlugs.length, "core Gumroad products live (6)", `${gumLive}/${gumroadSlugs.length}`);

const report = {
  generatedAt: new Date().toISOString(),
  url: `${base}/play`,
  build: liveBuild,
  passed,
  failed,
  checks: results,
  manualRemaining: [
    "Physical iPhone Safari audio unlock + notch layout",
    "Physical Android Chrome gesture nav",
    "IAP sandbox purchase sheet (native/TestFlight)",
    "PWA Add to Home Screen on device",
    "Return hub after 30+ min background",
  ],
};
const outPath = join(root, "launch/DEVICE_QA_AUTOMATED.json");
writeFileSync(outPath, JSON.stringify(report, null, 2));

console.log(`\n${passed} passed, ${failed} failed`);
console.log(`Report: launch/DEVICE_QA_AUTOMATED.json`);
process.exit(failed > 0 ? 1 : 0);