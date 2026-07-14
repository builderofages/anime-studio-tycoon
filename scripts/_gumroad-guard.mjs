/**
 * Gumroad safety — NO browser, NO gumroad CLI, NO URL spam.
 * Distribution is complete (launch/GUMROAD_FROZEN.json). Env token only when explicitly needed.
 */
import { existsSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const FROZEN_PATH = join(root, "launch/GUMROAD_FROZEN.json");

export function isGumroadFrozen() {
  return existsSync(FROZEN_PATH);
}

export function frozenMessage() {
  try {
    const j = JSON.parse(readFileSync(FROZEN_PATH, "utf8"));
    return `Gumroad distribution frozen (${j.productsLive} products live). No browser/CLI/API loops.`;
  } catch {
    return "Gumroad distribution frozen. No browser/CLI/API loops.";
  }
}

/** Exit 0 if frozen — scripts become no-ops unless --force */
export function exitIfFrozenUnlessForce() {
  if (isGumroadFrozen() && !process.argv.includes("--force")) {
    console.log(frozenMessage());
    console.log("  Game is live: https://anime-studio-tycoon.vercel.app/play");
    console.log("  Pass --force only if you intentionally need to re-run API updates.");
    process.exit(0);
  }
}

/** Token from GUMROAD_ACCESS_TOKEN env ONLY — never spawns gumroad CLI (can trigger browser flows). */
export function requireToken() {
  const token = process.env.GUMROAD_ACCESS_TOKEN?.trim();
  if (!token) {
    console.error("Missing GUMROAD_ACCESS_TOKEN env var.");
    console.error("  Scripts do NOT run `gumroad auth login` or open Chrome.");
    console.error("  Gumroad is already configured on Vercel — you usually don't need this script.");
    process.exit(1);
  }
  return token;
}

/** Optional token — never calls gumroad CLI. */
export function optionalToken() {
  return process.env.GUMROAD_ACCESS_TOKEN?.trim() || null;
}