#!/usr/bin/env node
/**
 * Full Gumroad distribution ship — auth poll → create 7 SKUs → Vercel env → verify.
 * Usage: node scripts/gumroad-ship.mjs
 * Requires: gumroad CLI (brew install antiwork/cli/gumroad), vercel CLI logged in.
 */
import { spawn, spawnSync } from "child_process";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SELLER_ID = "2936157234519";
const REDIRECT_BASE = "https://anime-studio-tycoon.vercel.app/api/grant/finish";

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

function getToken() {
  if (process.env.GUMROAD_ACCESS_TOKEN) return process.env.GUMROAD_ACCESS_TOKEN.trim();
  const p = run("gumroad", ["auth", "token"]);
  if (p.status === 0 && p.stdout?.trim()) return p.stdout.trim();
  return null;
}

function setVercel(name, value) {
  const p = run("vercel", ["env", "add", name, "production"], { input: value + "\n" });
  return p.status === 0;
}

async function waitForAuth(maxMs = 120000) {
  const start = Date.now();
  console.log("Log in to Gumroad in Chrome (passkey or Google), then this script continues.\n");
  console.log("  One tab only — do not run gumroad auth login in a loop.\n");
  spawn("open", ["-a", "Google Chrome", "https://gumroad.com/login?next=%2Fproducts"], { stdio: "ignore" }).unref();

  while (Date.now() - start < maxMs) {
    const st = run("gumroad", ["auth", "status"]);
    if (st.stdout?.includes("logged in") || st.stdout?.includes("Authenticated")) {
      const token = getToken();
      if (token) return token;
    }
    const token = getToken();
    if (token) return token;
    await new Promise((r) => setTimeout(r, 5000));
    process.stdout.write(".");
  }
  return null;
}

console.log("Anime Studio Tycoon — Gumroad ship\n");

const probe = await fetch("https://trainagent.gumroad.com/l/xmwvvi", { redirect: "follow" });
if (probe.status === 429) {
  console.error("✗ Gumroad IP rate-limited (429). Do NOT retry auth loops.");
  console.error("  Wait 2–6 hours, or switch to phone hotspot, then: npm run gumroad-ship");
  process.exit(2);
}

let token = getToken();
if (!token) token = await waitForAuth();
if (!token) {
  console.error("\n✗ No Gumroad token — log in via Chrome (passkey or Google), then re-run: npm run gumroad-ship");
  process.exit(1);
}
console.log("\n✓ Gumroad authenticated\n");

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
  const idMatch = (cr.stdout + cr.json) && cr.stdout?.match(/id[:\s]+([A-Za-z0-9_-]+==)/i);
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
    manual: "Enable license key + set redirect URL in Gumroad product Settings",
  });
}

const report = { at: new Date().toISOString(), created };
writeFileSync(join(root, "launch/GUMROAD_SHIP.json"), JSON.stringify(report, null, 2));

console.log("\nDeploying Vercel...");
run("vercel", ["--prod", "--yes"], { stdio: "inherit" });

console.log("\nVerifying...");
run("node", ["scripts/verify-gumroad.mjs"], { stdio: "inherit" });
run("node", ["scripts/launch-readiness.mjs"], { stdio: "inherit" });

console.log("\nDone. Report: launch/GUMROAD_SHIP.json");
if (created.some((c) => c.manual)) {
  console.log("\nManual per product (API cannot set license keys):");
  for (const c of created.filter((x) => x.manual)) {
    console.log(`  ${c.slug}: license key ON → ${c.redirect}`);
  }
}