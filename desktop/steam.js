/* Steamworks integration (optional). No-ops cleanly if steamworks.js or the
 * Steam client / app id aren't available, so dev builds and CI still run.
 *
 * Setup for a real release:
 *   1. Get a Steam App ID from the Steamworks partner site.
 *   2. Put it in steam_appid.txt (next to the built binary) or set STEAM_APP_ID.
 *   3. Create achievements in Steamworks whose API names match achievements.json.
 */
const fs = require("fs");
const path = require("path");

let client = null;
let MAP = {};

function appId() {
  if (process.env.STEAM_APP_ID) return parseInt(process.env.STEAM_APP_ID, 10);
  try {
    const f = path.join(__dirname, "steam_appid.txt");
    if (fs.existsSync(f)) return parseInt(fs.readFileSync(f, "utf8").trim(), 10);
  } catch (e) {}
  return 480; // Spacewar — Valve's public test app id; replace before release
}

function init() {
  try { MAP = JSON.parse(fs.readFileSync(path.join(__dirname, "achievements.json"), "utf8")); } catch (e) { MAP = {}; }
  let sw;
  try { sw = require("steamworks.js"); } catch (e) { console.warn("steamworks.js not installed — Steam features disabled."); return; }
  try {
    client = sw.init(appId());
    console.log("Steam ready:", client.localplayer.getName());
  } catch (e) {
    console.warn("Steam not running — features disabled:", e && e.message);
    client = null;
  }
}

// game achievement id (e.g. "rel100") -> Steam API name (from achievements.json)
function unlock(gameId) {
  if (!client) return;
  const apiName = MAP[gameId] || gameId;
  try {
    if (!client.achievement.isActivated(apiName)) {
      client.achievement.activate(apiName);
    }
  } catch (e) { /* unknown achievement name — ignore */ }
}

module.exports = { init, unlock };
