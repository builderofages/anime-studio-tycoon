#!/usr/bin/env node
/**
 * Gumroad distribution ship — NO browser automation, NO auth polling.
 * Usage:
 *   GUMROAD_ACCESS_TOKEN=xxx node scripts/gumroad-ship.mjs
 *   node scripts/gumroad-ship.mjs --verify   # also run verify + launch-readiness
 *
 * Auth: set token yourself (gumroad auth login once). This script never opens Chrome.
 */
import { spawnSync } from "child_process";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { probeRateLimit, exitOnRateLimit, requireToken } from "./_gumroad-guard.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SELLER_ID = "2936157234519";
const REDIRECT_BASE = "https://anime-studio-tycoon.vercel.app/api/grant/finish";
const runVerify = process.argv.includes("--verify");

const PRODUCTS = [
  { slug: "astlegend", name: "Anime Studio Tycoon — Legend Bundle", price: "7.99", desc: "Producer Pass (+50% Yen forever, auto-release, 2× offline) + 400 Gems + exclusive Legendary star Aurora Vesper." },
  { slug: "astmogul", name: "Anime Studio Tycoon — Mogul Bundle", price: "19.99", desc: "Producer Pass + 1,500 Gems + exclusive Legendary stars Phoenix Kogane & Kaiser Shogun + Remove Ads." },
  { slug: "astaurora", name: "Anime Studio Tycoon — Aurora Vesper (Exclusive Star)", price: "3.99", desc: "Unlock Aurora Vesper, a permanent Legendary Director exclusive." },
  { slug: "astphoenix", name: "Anime Studio Tycoon — Phoenix Kogane (Exclusive Star)", price: "3.99", desc: "Unlock Phoenix Kogane, a permanent Legendary Animator exclusive." },
  { slug: "astshogun", name: "Anime Studio Tycoon — Kaiser Shogun (Exclusive Star)", price: "4.99", desc: "Unlock Kaiser Shogun, a permanent Legendary Voice star exclusive." },
  { slug: "astitems", name: "Anime Studio Tycoon — Power Items Pack", price: "2.99", desc: "5 premium consumable items + 50 bonus Gems." },
  { slug: "astnoads", name: "Anime Studio Tycoon — Remove Ads", price: "2.99", desc: "Removes optional ad prompts on web." },
];

function run(cmd, args, opts = {}) {
  return spawnSync(cmd, args, { cwd: root, encoding: "utf8", ...opts });
}

function gumroad(args) {
  return run("gumroad", [...args, "--non-interactive", "--yes"], { env: { ...process.env } });
}

async function isLive(slug) {
  try {
    const r = await fetch(`https://trainagent.gumroad.com/l/${slug}`, { redirect: "follow" });
    return r.ok;
  } catch {
    return false;
  }
}

function setVercel(name, value) {
  const p = run("vercel", ["env", "add", name, "production"], { input: value + "\n" });
  return p.status === 0;
}

console.log("Anime Studio Tycoon — Gumroad ship (no Chrome / no auth polling)\n");

try {
  await probeRateLimit();
} catch (e) {
  exitOnRateLimit(e);
}

const token = requireToken();

const allLive = (await Promise.all(PRODUCTS.map((p) => isLive(p.slug)))).every(Boolean);
if (allLive) {
  console.log("✓ All 7 extended SKUs already live — skipping create/publish.");
  console.log("  Re-run with --verify to refresh status, or npm run configure-gumroad if license keys need updating.\n");
  if (!runVerify) process.exit(0);
}

console.log("✓ Gumroad token present\n");

if (!allLive) {
  console.log("Setting Vercel env...");
  setVercel("GUMROAD_ACCESS_TOKEN", token);
  setVercel("GUMROAD_SELLER_ID", SELLER_ID);

  const created = [];
  for (const p of PRODUCTS) {
    if (await isLive(p.slug)) {
      console.log(`  ○ ${p.slug} already live`);
      created.push({ ...p, status: "live" });
      continue;
    }
    console.log(`  + Creating ${p.slug}...`);
    const cr = gumroad([
      "products", "create",
      "--type", "digital",
      "--name", p.name,
      "--price", p.price,
      "--custom-permalink", p.slug,
      "--description", `<p>${p.desc} Play at anime-studio-tycoon.vercel.app</p>`,
      "--custom-summary", p.desc,
    ]);
    if (cr.status !== 0) {
      console.error(`    ✗ ${cr.stderr || cr.stdout}`);
      created.push({ ...p, status: "error", error: cr.stderr || cr.stdout });
      continue;
    }
    let id = null;
    const j = gumroad(["products", "list", "--json", "--jq", `.products[] | select(.custom_permalink=="${p.slug}" or (.short_url|contains("${p.slug}"))) | .id`]);
    if (j.stdout?.trim()) id = j.stdout.trim().split("\n")[0];

    if (id) {
      gumroad(["products", "publish", id]);
      console.log(`    ✓ published ${p.slug}`);
    } else {
      console.log(`    ✓ created ${p.slug} (publish manually if draft)`);
    }
    created.push({
      ...p,
      status: "created",
      redirect: `${REDIRECT_BASE}?permalink=${p.slug}&license_key={license_key}`,
    });
  }

  writeFileSync(join(root, "launch/GUMROAD_SHIP.json"), JSON.stringify({ at: new Date().toISOString(), created }, null, 2));
  console.log("\nReport: launch/GUMROAD_SHIP.json");
  console.log("Next: npm run configure-gumroad  # license keys + redirects (one batch)");
}

if (runVerify) {
  console.log("\nVerifying (explicit --verify)...");
  run("node", ["scripts/verify-gumroad.mjs"], {
    stdio: "inherit",
    env: { ...process.env, GUMROAD_ACCESS_TOKEN: token },
  });
  run("node", ["scripts/launch-readiness.mjs"], { stdio: "inherit" });
}

console.log("\nDone.");