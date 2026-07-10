#!/usr/bin/env node
/**
 * Control the user's open Google Chrome — OPT-IN ONLY (prevents accidental tab spam).
 * Usage:
 *   GUMROAD_ALLOW_CHROME=1 node scripts/gumroad-chrome.mjs tabs
 *   node scripts/gumroad-chrome.mjs navigate <url> --allow-chrome
 */
import { spawnSync } from "child_process";

const allowed =
  process.env.GUMROAD_ALLOW_CHROME === "1" || process.argv.includes("--allow-chrome");

if (!allowed) {
  console.error("Chrome automation disabled (prevents Gumroad/login tab spam).");
  console.error("  Use your own browser manually, or pass --allow-chrome / GUMROAD_ALLOW_CHROME=1");
  process.exit(1);
}

const argv = process.argv.slice(2).filter((a) => a !== "--allow-chrome");
const [cmd, ...args] = argv;

function osa(script) {
  const r = spawnSync("osascript", ["-e", script], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(r.stderr || r.stdout || "osascript failed");
  return (r.stdout || "").trim();
}

function ensureWindow() {
  const n = Number(osa('tell application "Google Chrome" to count windows') || 0);
  if (n === 0) {
    osa('tell application "Google Chrome" to activate\ntell application "System Events" to keystroke "n" using {command down}');
    spawnSync("sleep", ["2"]);
  }
}

if (cmd === "tabs") {
  console.log(
    osa(`tell application "Google Chrome"
  set out to ""
  repeat with w in windows
    repeat with t in tabs of w
      set out to out & (URL of t) & tab & (title of t) & linefeed
    end repeat
  end repeat
  return out
end tell`),
  );
  process.exit(0);
}

if (cmd === "navigate") {
  const url = args[0];
  if (!url) throw new Error("usage: navigate <url>");
  ensureWindow();
  osa(`tell application "Google Chrome"
  activate
  set URL of active tab of front window to "${url.replace(/"/g, '\\"')}"
end tell`);
  spawnSync("sleep", ["4"]);
  console.log(osa('tell application "Google Chrome" to get title of active tab of front window'));
  console.log(osa('tell application "Google Chrome" to get URL of active tab of front window'));
  process.exit(0);
}

if (cmd === "eval") {
  const js = args.join(" ");
  if (!js) throw new Error("usage: eval <javascript>");
  const escaped = js.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const out = osa(`tell application "Google Chrome"
  return execute active tab of front window javascript "${escaped}"
end tell`);
  console.log(out);
  process.exit(0);
}

console.log(`Commands: tabs | navigate <url> | eval <js>  (requires --allow-chrome)`);
process.exit(1);