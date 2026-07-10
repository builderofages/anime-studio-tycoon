#!/usr/bin/env node
/**
 * Enable license keys + post-purchase redirect on all Anime Studio Gumroad SKUs.
 * Usage:
 *   GUMROAD_ACCESS_TOKEN=$(gumroad auth token) node scripts/configure-gumroad-products.mjs
 *   node scripts/configure-gumroad-products.mjs --dry-run
 */
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const base = "https://anime-studio-tycoon.vercel.app";
const dryRun = process.argv.includes("--dry-run");
const sleepMs = 600;

const SLUGS = [
  "xmwvvi", "xjpwv", "jbclqp", "legvhu", "gtdyn", "kttuab",
  "astlegend", "astmogul", "astaurora", "astphoenix", "astshogun", "astitems", "astnoads",
];

function getToken() {
  if (process.env.GUMROAD_ACCESS_TOKEN) return process.env.GUMROAD_ACCESS_TOKEN.trim();
  const p = spawnSync("gumroad", ["auth", "token"], { encoding: "utf8" });
  if (p.status === 0 && p.stdout?.trim()) return p.stdout.trim();
  return null;
}

function redirect(slug) {
  return `${base}/api/grant/finish?permalink=${slug}&license_key={license_key}`;
}

async function gumroadGet(path) {
  const sep = path.includes("?") ? "&" : "?";
  const r = await fetch(`https://api.gumroad.com/v2${path}${sep}access_token=${encodeURIComponent(token)}`);
  if (r.status === 429) throw new Error("Gumroad rate limited (429) — stop and retry later");
  return r.json();
}

async function gumroadPut(productId, body) {
  const r = await fetch(`https://api.gumroad.com/v2/products/${productId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ access_token: token, ...body }).toString(),
  });
  if (r.status === 429) throw new Error("Gumroad rate limited (429) — stop and retry later");
  return r.json();
}

function idFromCreateReport(slug) {
  try {
    const report = JSON.parse(readFileSync(join(root, "launch/GUMROAD_CREATE.json"), "utf8"));
    const row = report.results?.find((r) => r.slug === slug && r.id);
    return row?.id || null;
  } catch {
    return null;
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const token = getToken();
if (!token) {
  console.error("Missing GUMROAD_ACCESS_TOKEN. Run: gumroad auth login");
  process.exit(1);
}

console.log("Anime Studio Tycoon — configure Gumroad license keys + redirects\n");
if (dryRun) console.log("(dry-run — no API writes)\n");

const results = [];
let ok = 0;
let fail = 0;

for (const slug of SLUGS) {
  let productId = idFromCreateReport(slug);
  let name = slug;

  if (!productId) {
    const j = await gumroadGet(`/products/${slug}`);
    if (j.success && j.product?.id) {
      productId = j.product.id;
      name = j.product.name || slug;
    } else {
      fail++;
      console.error(`  ✗ ${slug} — cannot resolve product id (${j.message || "not found"})`);
      results.push({ slug, status: "error", error: j.message || "not found" });
      await sleep(sleepMs);
      continue;
    }
  } else {
    const j = await gumroadGet(`/products/${productId}`);
    if (j.success && j.product?.name) name = j.product.name;
  }

  const payload = {
    should_generate_license_key: "true",
    custom_success_url: redirect(slug),
  };

  if (dryRun) {
    ok++;
    console.log(`  ○ ${slug} — would update ${productId}`);
    results.push({ slug, id: productId, status: "dry-run", redirect: payload.custom_success_url });
    await sleep(sleepMs);
    continue;
  }

  try {
    const j = await gumroadPut(productId, payload);
    if (!j.success) throw new Error(j.message || JSON.stringify(j));
    ok++;
    console.log(`  ✓ ${slug} — license key + redirect`);
    results.push({ slug, id: productId, name, status: "configured", redirect: payload.custom_success_url });
  } catch (e) {
    fail++;
    console.error(`  ✗ ${slug} — ${e.message}`);
    results.push({ slug, id: productId, status: "error", error: e.message });
  }

  await sleep(sleepMs);
}

const report = { at: new Date().toISOString(), ok, fail, dryRun, results };
writeFileSync(join(root, "launch/GUMROAD_CONFIGURE.json"), JSON.stringify(report, null, 2));

console.log(`\nConfigured ${ok}/${SLUGS.length}. Report: launch/GUMROAD_CONFIGURE.json`);
process.exit(fail ? 1 : 0);