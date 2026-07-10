/**
 * Shared Gumroad safety — one probe, no browser automation, no auth polling.
 */
import { spawnSync } from "child_process";

const PROBE_URL = "https://trainagent.gumroad.com/l/xmwvvi";

/** Single HTTP probe; throws on 429. */
export async function probeRateLimit(url = PROBE_URL) {
  const r = await fetch(url, { redirect: "follow" });
  if (r.status === 429) {
    const err = new Error("Gumroad rate-limited (HTTP 429). Stop retrying — wait 2–6h.");
    err.code = "RATE_LIMIT";
    throw err;
  }
  return r;
}

export function exitOnRateLimit(err) {
  if (err?.code === "RATE_LIMIT" || String(err?.message).includes("429")) {
    console.error(`✗ ${err.message}`);
    console.error("  Do NOT open Chrome or run gumroad auth login in a loop.");
    process.exit(2);
  }
}

/** Token from env only — never spawns `gumroad auth login` or polls auth status. */
export function getTokenFromEnv() {
  const t = process.env.GUMROAD_ACCESS_TOKEN?.trim();
  return t || null;
}

/** One read of stored CLI token (no login, no status poll). */
export function getTokenFromCliOnce() {
  if (process.env.GUMROAD_NO_CLI === "1") return null;
  const p = spawnSync("gumroad", ["auth", "token"], { encoding: "utf8", timeout: 5000 });
  if (p.status === 0 && p.stdout?.trim()) return p.stdout.trim();
  return null;
}

export function requireToken({ allowCli = true } = {}) {
  const token = getTokenFromEnv() || (allowCli ? getTokenFromCliOnce() : null);
  if (!token) {
    console.error("Missing GUMROAD_ACCESS_TOKEN.");
    console.error("  One-time (you): gumroad auth login → export GUMROAD_ACCESS_TOKEN=$(gumroad auth token)");
    console.error("  Scripts will NOT open Chrome or poll Gumroad auth for you.");
    process.exit(1);
  }
  return token;
}

export function refuseUnlessFlag(flag, message) {
  if (!process.argv.includes(flag)) {
    console.error(message);
    process.exit(1);
  }
}