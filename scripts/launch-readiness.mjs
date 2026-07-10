#!/usr/bin/env node
/**
 * Launch readiness score — engineering vs distribution gates.
 * Usage: node scripts/launch-readiness.mjs [--url=...]
 */
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const base = process.argv.find((a) => a.startsWith("--url="))?.split("=")[1]
  || "https://anime-studio-tycoon.vercel.app";

function buildNum(html) {
  const m = html.match(/build\s+(\d+)/i);
  return m ? parseInt(m[1], 10) : 0;
}

function gumroadSlugsLiveFromCache(slugs, maxAgeMs = 24 * 60 * 60 * 1000) {
  try {
    const status = JSON.parse(readFileSync(join(root, "launch/GUMROAD_STATUS.json"), "utf8"));
    const age = Date.now() - new Date(status.checkedAt).getTime();
    if (age > maxAgeMs) return null;
    const bySlug = Object.fromEntries((status.products || []).map((p) => [p.slug, p.ok]));
    if (slugs.every((s) => bySlug[s] === true)) return true;
    if (slugs.some((s) => bySlug[s] === false)) return false;
    return null;
  } catch {
    return null;
  }
}

async function gumroadLive(slug) {
  try {
    const r = await fetch(`https://trainagent.gumroad.com/l/${slug}`, { redirect: "follow" });
    return r.ok;
  } catch {
    return false;
  }
}

async function gumroadGroupLive(slugs) {
  const cached = gumroadSlugsLiveFromCache(slugs);
  if (cached !== null) return cached;
  const live = await Promise.all(slugs.map(gumroadLive));
  return live.every(Boolean);
}

const engineering = [
  { id: "smoke_tests", label: "982+ smoke + sim tests", weight: 12, check: () => {
    const t = spawnSync("npm", ["test"], { cwd: root, encoding: "utf8", timeout: 120000 });
    return t.status === 0;
  }},
  { id: "sim_tests", label: "playtest-sim honest flow", weight: 8, check: () => {
    const t = spawnSync("npm", ["run", "test:sim"], { cwd: root, encoding: "utf8", timeout: 120000 });
    return t.status === 0;
  }},
  { id: "native_bundle", label: "www/ native bundle", weight: 10, check: () => {
    if (!existsSync(join(root, "www/index.html"))) return false;
    const local = buildNum(readFileSync(join(root, "index.html"), "utf8"));
    const www = buildNum(readFileSync(join(root, "www/index.html"), "utf8"));
    return local >= 118 && www >= 118;
  }},
  { id: "live_deploy", label: "Vercel production build", weight: 10, check: async () => {
    const r = await fetch(`${base}/play`);
    const html = await r.text();
    return r.ok && buildNum(html) >= 117; /* live may lag until deploy */
  }},
  { id: "grant_api", label: "Grant JWT API", weight: 8, check: async () => {
    const r = await fetch(`${base}/api/grant/redeem?pt=bad`);
    const j = await r.json();
    return r.status === 400 && !!j.error;
  }},
  { id: "store_assets", label: "Store screenshots + icon", weight: 6, check: () =>
    ["app-icon.png", "screenshot-produce.png", "screenshot-stars.png"].every((f) =>
      existsSync(join(root, "launch/store", f))) },
  { id: "desktop_dist", label: "Steam desktop .dmg", weight: 6, check: () => existsSync(join(root, "desktop/dist")) },
  { id: "codemagic_yaml", label: "Codemagic iOS/Android yaml", weight: 5, check: () => existsSync(join(root, "codemagic.yaml")) },
  { id: "i18n_complete", label: "Premiere + hub i18n (UI5/UI6)", weight: 10, check: () => {
    const s = readFileSync(join(root, "strings.js"), "utf8");
    const h = readFileSync(join(root, "index.html"), "utf8");
    return s.includes("UI5") && s.includes("UI6") && h.includes('tf("hub_welcome"');
  }},
  { id: "web_qa_auto", label: "Automated web device QA", weight: 10, check: () => {
    const t = spawnSync("node", ["scripts/device-qa-web.mjs", `--url=${base}`], { cwd: root, encoding: "utf8", timeout: 60000 });
    return t.status === 0;
  }},
  { id: "ci_workflow", label: "GitHub Actions CI", weight: 5, check: () => existsSync(join(root, ".github/workflows/ci.yml")) },
  { id: "guides", label: "Launch guides complete", weight: 10, check: () =>
    ["DEVICE_QA.md", "TESTFLIGHT_CHECKLIST.md", "GUMROAD_SETUP.md", "CODEMAGIC.md"].every((f) =>
      existsSync(join(root, "launch", f))) },
];

const distribution = [
  { id: "gumroad_core", label: "6 core Gumroad SKUs live", weight: 15, check: async () => {
    const slugs = ["xmwvvi", "xjpwv", "jbclqp", "legvhu", "gtdyn", "kttuab"];
    return gumroadGroupLive(slugs);
  }},
  { id: "gumroad_extended", label: "7 extended Gumroad SKUs live", weight: 15, check: async () => {
    const slugs = ["astlegend", "astmogul", "astaurora", "astphoenix", "astshogun", "astitems", "astnoads"];
    return gumroadGroupLive(slugs);
  }},
  { id: "gumroad_token", label: "GUMROAD_ACCESS_TOKEN on Vercel", weight: 10, check: async () => {
    const r = await fetch(`${base}/api/grant/health`);
    const j = await r.json();
    return r.ok && j.gumroad_token === true;
  }},
  { id: "gumroad_seller", label: "GUMROAD_SELLER_ID on Vercel", weight: 5, check: async () => {
    const r = await fetch(`${base}/api/grant/health`);
    const j = await r.json();
    return r.ok && j.gumroad_seller === true;
  }},
  { id: "apple_iap", label: "APPLE_SHARED_SECRET on Vercel", weight: 10, check: async () => {
    const r = await fetch(`${base}/api/grant/health`);
    const j = await r.json();
    return r.ok && j.apple_shared_secret === true;
  }, manual: "Vercel env + ASC shared secret" },
  { id: "testflight", label: "TestFlight build uploaded", weight: 15, check: () => false, manual: "Codemagic ios-release" },
  { id: "device_qa_manual", label: "Physical device QA sign-off", weight: 15, check: () => false, manual: "launch/DEVICE_QA.md sections 1–8" },
  { id: "steam_page", label: "Steam store page live", weight: 10, check: () => false, manual: "launch/STEAM_SUBMISSION.md" },
];

async function scoreSection(items) {
  let earned = 0;
  let total = 0;
  const detail = [];
  for (const item of items) {
    total += item.weight;
    let pass = false;
    try {
      pass = !!await item.check();
    } catch {
      pass = false;
    }
    if (pass) earned += item.weight;
    detail.push({ ...item, pass, manual: item.manual || null });
  }
  return { earned, total, pct: Math.round((earned / total) * 100), detail };
}

console.log("Anime Studio Tycoon — launch readiness\n");

const eng = await scoreSection(engineering);
const dist = await scoreSection(distribution);
const overall = Math.round(((eng.earned + dist.earned) / (eng.total + dist.total)) * 100);

for (const item of eng.detail) {
  console.log(`  ${item.pass ? "✓" : "✗"} [eng] ${item.label} (${item.weight})`);
}
console.log(`\n  Engineering: ${eng.pct}% (${eng.earned}/${eng.total})\n`);

for (const item of dist.detail) {
  const tag = item.pass ? "✓" : item.manual ? "○" : "✗";
  console.log(`  ${tag} [dist] ${item.label} (${item.weight})${item.manual && !item.pass ? ` — ${item.manual}` : ""}`);
}
console.log(`\n  Distribution: ${dist.pct}% (${dist.earned}/${dist.total})`);
console.log(`\n  Overall: ${overall}%`);

const report = {
  generatedAt: new Date().toISOString(),
  build: buildNum(readFileSync(join(root, "index.html"), "utf8")),
  engineering: eng,
  distribution: dist,
  overallPct: overall,
  engineeringComplete: eng.pct === 100,
};
writeFileSync(join(root, "launch/LAUNCH_READINESS.json"), JSON.stringify(report, null, 2));
console.log("\nReport: launch/LAUNCH_READINESS.json");

process.exit(eng.pct === 100 ? 0 : 1);