#!/usr/bin/env node
/**
 * Smoke test — static checks + strings module + syntax validation.
 * Run: npm test
 */
import { readFileSync, existsSync } from "fs";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0;
let failed = 0;

function ok(name) {
  passed++;
  console.log(`  ✓ ${name}`);
}
function fail(name, err) {
  failed++;
  console.error(`  ✗ ${name}: ${err}`);
}
function assert(cond, name, msg = "failed") {
  if (cond) ok(name);
  else fail(name, msg);
}

console.log("Anime Studio Tycoon — smoke test\n");

const required = [
  "index.html",
  "strings.js",
  "logic.js",
  "aaa-upgrade.js",
  "aaa-upgrade.css",
  "gameplay-plus.js",
  "gameplay-plus.css",
  "gameplay-ultra.js",
  "gameplay-ultra.css",
  "gameplay-endless.js",
  "gameplay-endless.css",
  "gameplay-empire.js",
  "gameplay-empire.css",
  "gameplay-studio.js",
  "gameplay-studio.css",
  "gameplay-final.js",
  "gameplay-final.css",
  "gameplay-aaa.js",
  "gameplay-aaa.css",
  "gameplay-legend.js",
  "gameplay-legend.css",
  "hud-premium.js",
  "hud-premium.css",
  "ui-complete.js",
  "ui-complete.css",
  "gameplay-studio-rating.js",
  "gameplay-studio-rating.css",
  "hook-bridge.js",
  "gameplay-polish.js",
  "design-overhaul.css",
  "manifest.json",
  "privacy.html",
  "terms.html",
  "scripts/prepare-native.mjs",
];
for (const f of required) {
  assert(existsSync(join(root, f)), `file exists: ${f}`);
}

const html = readFileSync(join(root, "index.html"), "utf8");
assert(!html.includes('${t("k_level"'), "no baked template literals in HTML");
assert(html.includes("window.__AST_HOOK__"), "AST hook exported");
assert(html.includes('src="aaa-upgrade.js"'), "aaa-upgrade.js linked");
assert(html.includes('src="gameplay-plus.js"'), "gameplay-plus.js linked");
assert(html.includes("pityCount"), "scout pity state");
assert(html.includes("merchLevel"), "merch line state");
assert(html.includes("autoGreenlight"), "auto-greenlight state");
assert(html.includes("marketShare"), "market share state");
assert(html.includes("applyAudioSettings"), "audio settings");
assert(html.includes('src="gameplay-ultra.js"'), "gameplay-ultra.js linked");
assert(html.includes('src="gameplay-endless.js"'), "gameplay-endless.js linked");
assert(html.includes("endlessRisk"), "endless risk state");
assert(html.includes("endlessDiff"), "endless difficulty state");
assert(html.includes("projectStars"), "projectStars on hook");
assert(html.includes('src="gameplay-empire.js"'), "gameplay-empire.js linked");
assert(html.includes("namedStaff"), "named staff state");
assert(html.includes("pullStar"), "pullStar on hook");
assert(html.includes('src="gameplay-studio.js"'), "gameplay-studio.js linked");
assert(html.includes("sparks"), "spark currency state");
assert(html.includes("__AST_CONFIRM__"), "in-theme confirm hook");
assert(html.includes('src="gameplay-final.js"'), "gameplay-final.js linked");
assert(html.includes("influence"), "influence currency state");
assert(html.includes("streaming"), "streaming contracts state");
assert(html.includes("_finalReleaseMult"), "final release multiplier");
assert(html.includes('src="gameplay-aaa.js"'), "gameplay-aaa.js linked");
assert(html.includes("dynastyPoints"), "dynasty points state");
assert(html.includes("festivalWins"), "festival wins state");
assert(html.includes("_aaaReleaseMult"), "aaa release multiplier");
assert(html.includes("window.ACHIEVEMENTS"), "achievements exposed for aaa popups");
assert(html.includes('src="gameplay-legend.js"'), "gameplay-legend.js linked");
assert(html.includes("dynastyPerks"), "dynasty perks state");
assert(html.includes("_legendReleaseMult"), "legend release multiplier");
assert(html.includes('src="hud-premium.js"'), "hud-premium.js linked");
assert(html.includes("hud-premium.css"), "hud-premium.css linked");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("pathway-rail"), "pathway rail in hud script");
assert(html.includes('src="ui-complete.js"'), "ui-complete.js linked");
assert(readFileSync(join(root, "ui-complete.js"), "utf8").includes("ui-tab-hero"), "tab hero layouts");
assert(html.includes('src="gameplay-studio-rating.js"'), "gameplay-studio-rating.js linked");
assert(html.includes("gameplay-studio-rating.css"), "gameplay-studio-rating.css linked");
assert(html.includes("studioStars"), "studio star rating state");
assert(html.includes("starUnlock"), "project star gates");
assert(readFileSync(join(root, "gameplay-studio-rating.js"), "utf8").includes("jw-studio-rank"), "JW rating HUD");
assert(html.includes('src="hook-bridge.js"'), "hook-bridge.js linked");
assert(readFileSync(join(root, "hook-bridge.js"), "utf8").includes("__globalsRebound"), "hook global rebind");
assert(readFileSync(join(root, "gameplay-aaa.js"), "utf8").includes("__aaaLayerInstalled"), "aaa layer install flag");
assert(html.includes("hire,") && html.includes("expandStudio,"), "hire/expand on hook");
assert(html.includes('src="gameplay-polish.js"'), "gameplay-polish.js linked");
assert(html.includes("crisisSnoozeUntil"), "crisis snooze state");
assert(html.includes('id:"rat5"'), "studio rating achievements");
assert(html.includes("design-overhaul.css"), "design overhaul css linked");
assert(html.includes("premium-hud"), "early premium-hud class");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("hud-studio-rating"), "rating in hud shell");
assert(html.includes("seasonClaimed"), "season pass state");
assert(html.includes('id="main"></div>'), "clean #main shell");
assert(html.includes("BUILD_TAG"), "build tag constant");
assert(html.includes("whatsnew"), "what's new modal");

const rawCount = (html.match(/__raw/g) || []).length;
assert(rawCount <= 2, "single __raw redirect script", `found ${rawCount}`);

for (const f of ["strings.js", "logic.js", "aaa-upgrade.js", "gameplay-plus.js", "gameplay-ultra.js", "gameplay-endless.js", "gameplay-empire.js", "gameplay-studio.js", "gameplay-final.js", "gameplay-aaa.js", "gameplay-legend.js", "hud-premium.js", "ui-complete.js", "gameplay-studio-rating.js", "gameplay-polish.js", "hook-bridge.js"]) {
  const r = spawnSync("node", ["--check", join(root, f)], { encoding: "utf8" });
  assert(r.status === 0, `syntax OK: ${f}`, r.stderr?.trim());
}

try {
  const { t, setLang, LANGS } = await import(`file://${join(root, "strings.js")}`);
  setLang("en");
  assert(typeof t("tab_produce") === "string" && t("tab_produce").length > 0, "strings.js t() en");
  assert(Object.keys(LANGS).length >= 6, "6+ languages");
} catch (e) {
  fail("strings.js import", e.message);
}

try {
  const manifest = JSON.parse(readFileSync(join(root, "manifest.json"), "utf8"));
  assert(manifest.name && manifest.start_url, "manifest.json valid");
} catch (e) {
  fail("manifest.json", e.message);
}

const prep = spawnSync("node", ["scripts/prepare-native.mjs"], { cwd: root, encoding: "utf8" });
assert(prep.status === 0, "prepare-native.mjs runs", prep.stderr?.trim() || prep.stdout?.trim());
assert(existsSync(join(root, "www/index.html")), "www/index.html created");
assert(existsSync(join(root, "www/aaa-upgrade.js")), "www/aaa-upgrade.js copied");
assert(existsSync(join(root, "www/gameplay-ultra.js")), "www/gameplay-ultra.js copied");
assert(existsSync(join(root, "www/gameplay-endless.js")), "www/gameplay-endless.js copied");
const dpkg = JSON.parse(readFileSync(join(root, "desktop/package.json"), "utf8"));
assert(dpkg.build?.extraResources?.[0]?.filter?.includes("gameplay-ultra.js"), "desktop bundles ultra");
assert(dpkg.build?.extraResources?.[0]?.filter?.includes("gameplay-endless.js"), "desktop bundles endless");
assert(dpkg.build?.extraResources?.[0]?.filter?.includes("gameplay-empire.js"), "desktop bundles empire");
assert(dpkg.build?.extraResources?.[0]?.filter?.includes("gameplay-studio.js"), "desktop bundles studio");
assert(dpkg.build?.extraResources?.[0]?.filter?.includes("gameplay-final.js"), "desktop bundles final");
assert(existsSync(join(root, "www/gameplay-empire.js")), "www/gameplay-empire.js copied");
assert(existsSync(join(root, "www/gameplay-studio.js")), "www/gameplay-studio.js copied");
assert(existsSync(join(root, "www/gameplay-final.js")), "www/gameplay-final.js copied");
assert(existsSync(join(root, "www/gameplay-aaa.js")), "www/gameplay-aaa.js copied");
assert(dpkg.build?.extraResources?.[0]?.filter?.includes("gameplay-aaa.js"), "desktop bundles aaa");
assert(existsSync(join(root, "www/gameplay-legend.js")), "www/gameplay-legend.js copied");
assert(dpkg.build?.extraResources?.[0]?.filter?.includes("gameplay-legend.js"), "desktop bundles legend");
assert(existsSync(join(root, "www/hud-premium.js")), "www/hud-premium.js copied");
assert(dpkg.build?.extraResources?.[0]?.filter?.includes("hud-premium.js"), "desktop bundles hud");
assert(existsSync(join(root, "www/ui-complete.js")), "www/ui-complete.js copied");
assert(dpkg.build?.extraResources?.[0]?.filter?.includes("ui-complete.js"), "desktop bundles ui-complete");
assert(existsSync(join(root, "www/gameplay-studio-rating.js")), "www/gameplay-studio-rating.js copied");
assert(dpkg.build?.extraResources?.[0]?.filter?.includes("gameplay-studio-rating.js"), "desktop bundles studio-rating");
assert(existsSync(join(root, "www/hook-bridge.js")), "www/hook-bridge.js copied");
assert(dpkg.build?.extraResources?.[0]?.filter?.includes("hook-bridge.js"), "desktop bundles hook-bridge");
assert(existsSync(join(root, "www/gameplay-polish.js")), "www/gameplay-polish.js copied");
assert(dpkg.build?.extraResources?.[0]?.filter?.includes("gameplay-polish.js"), "desktop bundles polish");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);