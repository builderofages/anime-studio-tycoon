#!/usr/bin/env node
/**
 * Create missing Anime Studio Gumroad SKUs via API v2.
 * Usage:
 *   GUMROAD_ACCESS_TOKEN=xxx node scripts/create-gumroad-products.mjs
 *   GUMROAD_ACCESS_TOKEN=xxx node scripts/create-gumroad-products.mjs --publish
 *   GUMROAD_ACCESS_TOKEN=xxx node scripts/create-gumroad-products.mjs --set-vercel --publish
 */
import { spawnSync } from "child_process";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { probeRateLimit, exitOnRateLimit } from "./_gumroad-guard.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const base = "https://anime-studio-tycoon.vercel.app";
const publish = process.argv.includes("--publish");
const setVercel = process.argv.includes("--set-vercel");
const dryRun = process.argv.includes("--dry-run");

const PRODUCTS = [
  {
    slug: "astlegend",
    name: "Anime Studio Tycoon — Legend Bundle",
    price: 7.99,
    description:
      "Producer Pass (+50% Yen forever, auto-release, 2× offline) + 400 Gems + exclusive Legendary star Aurora Vesper. One-time purchase. Play at anime-studio-tycoon.vercel.app",
  },
  {
    slug: "astmogul",
    name: "Anime Studio Tycoon — Mogul Bundle",
    price: 19.99,
    description:
      "The ultimate bundle: Producer Pass + 1,500 Gems + exclusive Legendary stars Phoenix Kogane & Kaiser Shogun + Remove Ads. Best value for serious studio builders.",
  },
  {
    slug: "astaurora",
    name: "Anime Studio Tycoon — Aurora Vesper (Exclusive Star)",
    price: 3.99,
    description:
      "Unlock Aurora Vesper, a permanent Legendary Director exclusive — never available in the free scout pool. Duplicate purchases level her up.",
  },
  {
    slug: "astphoenix",
    name: "Anime Studio Tycoon — Phoenix Kogane (Exclusive Star)",
    price: 3.99,
    description:
      "Unlock Phoenix Kogane, a permanent Legendary Animator exclusive. Not in gacha. Duplicates increase star level.",
  },
  {
    slug: "astshogun",
    name: "Anime Studio Tycoon — Kaiser Shogun (Exclusive Star)",
    price: 4.99,
    description:
      "Unlock Kaiser Shogun, a permanent Legendary Voice star exclusive to paid supporters.",
  },
  {
    slug: "astitems",
    name: "Anime Studio Tycoon — Power Items Pack",
    price: 2.99,
    description:
      "5 premium consumable items (Megaphone, Power Gauntlet, Time Pendant, Stardust, Espresso) + 50 bonus Gems. Instant delivery in-game.",
  },
  {
    slug: "astnoads",
    name: "Anime Studio Tycoon — Remove Ads",
    price: 2.99,
    description:
      "Removes optional ad prompts on web. All free rewards (daily gems, 2× boost) remain available without watching ads.",
  },
];

const token = process.env.GUMROAD_ACCESS_TOKEN;
if (!token) {
  console.error("Missing GUMROAD_ACCESS_TOKEN.");
  console.error("Gumroad → Settings → Advanced → Generate access token");
  console.error("Then: GUMROAD_ACCESS_TOKEN=xxx node scripts/create-gumroad-products.mjs --publish --set-vercel");
  process.exit(1);
}

const redirect = (slug) =>
  `${base}/api/grant/finish?permalink=${slug}&license_key={license_key}`;

async function gumroad(path, method = "GET", body) {
  const url = `https://api.gumroad.com/v2${path}`;
  const opts = { method, headers: {} };
  if (body) {
    opts.headers["Content-Type"] = "application/x-www-form-urlencoded";
    opts.body = new URLSearchParams({ access_token: token, ...body }).toString();
  } else if (method === "GET") {
    const sep = path.includes("?") ? "&" : "?";
    return gumroad(`${path}${sep}access_token=${encodeURIComponent(token)}`, "GET");
  }
  const r = await fetch(url, opts);
  const j = await r.json();
  if (!j.success) throw new Error(j.message || JSON.stringify(j));
  return j;
}

async function isLive(slug) {
  try {
    const r = await fetch(`https://trainagent.gumroad.com/l/${slug}`, { redirect: "follow" });
    return r.ok;
  } catch {
    return false;
  }
}

function setVercelEnv(name, value) {
  const p = spawnSync("vercel", ["env", "add", name, "production"], {
    cwd: root,
    input: `${value}\n`,
    encoding: "utf8",
  });
  if (p.status === 0) console.log(`  ✓ Vercel ${name}`);
  else console.error(`  ✗ Vercel ${name}: ${(p.stderr || p.stdout || "").trim()}`);
}

console.log("Anime Studio Tycoon — create Gumroad products\n");

try {
  await probeRateLimit();
} catch (e) {
  exitOnRateLimit(e);
}

if (setVercel) {
  console.log("Setting Vercel env...");
  setVercelEnv("GUMROAD_ACCESS_TOKEN", token);
  setVercelEnv("GUMROAD_SELLER_ID", process.env.GUMROAD_SELLER_ID || "2936157234519");
  console.log("");
}

const results = [];
let created = 0;
let skipped = 0;

for (const p of PRODUCTS) {
  if (await isLive(p.slug)) {
    skipped++;
    console.log(`  ○ ${p.slug} — already live`);
    results.push({ ...p, status: "live" });
    continue;
  }

  const priceCents = Math.round(p.price * 100);
  console.log(`  + ${p.slug} — creating ($${p.price})`);

  if (dryRun) {
    results.push({ ...p, status: "dry-run" });
    continue;
  }

  try {
    const { product } = await gumroad("/products", "POST", {
      native_type: "digital",
      name: p.name,
      price: String(priceCents),
      currency: "usd",
      description: `<p>${p.description}</p>`,
      custom_permalink: p.slug,
      custom_summary: p.description.slice(0, 120),
    });

    if (publish) {
      await gumroad(`/products/${product.id}/enable`, "PUT", {});
    }

    created++;
    console.log(`    ✓ id=${product.id}${publish ? " (published)" : " (draft — run with --publish)"}`);
    results.push({
      ...p,
      status: publish ? "created_published" : "created_draft",
      id: product.id,
      redirect: redirect(p.slug),
      manual: [
        "Gumroad product → Settings → enable Generate license key",
        `Redirect URL: ${redirect(p.slug)}`,
      ],
    });
  } catch (e) {
    console.error(`    ✗ ${e.message}`);
    results.push({ ...p, status: "error", error: e.message });
  }
}

const manual = results.filter((r) => r.manual?.length);
if (manual.length) {
  console.log("\nPost-create (per product — API cannot set license keys / redirect):");
  for (const r of manual) {
    console.log(`  ${r.slug}:`);
    for (const line of r.manual) console.log(`    ${line}`);
  }
  console.log("\nPing webhook (once): https://anime-studio-tycoon.vercel.app/api/grant/gumroad");
}

const report = {
  at: new Date().toISOString(),
  created,
  skipped,
  publish,
  results,
};
writeFileSync(join(root, "launch/GUMROAD_CREATE.json"), JSON.stringify(report, null, 2));
console.log(`\nCreated ${created}, skipped ${skipped}. Report: launch/GUMROAD_CREATE.json`);

if (setVercel && !dryRun) {
  console.log("\nRedeploy for env: vercel --prod --yes");
}

process.exit(results.some((r) => r.status === "error") ? 1 : 0);