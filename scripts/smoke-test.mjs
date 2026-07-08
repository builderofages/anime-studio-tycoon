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
  "v5-render-guard.js",
  "studio-premium.css",
  "game-skin.css",
  "hf-design.css",
  "aaa-ui.css",
  "legacy-fx.css",
  "ast-v5.css",
  "bg-v4.png",
  "start-hero.png",
  "assets/hf/gacha-bg.png",
  "assets/hf/greenlight-bg.png",
  "icons/hf/yen.png",
  "icons/hf/fans.png",
  "icons/hf/hype.png",
  "icons/hf/gems.png",
  "icons/tabs/produce.png",
  "icons/tabs/store.png",
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
assert(/src="aaa-upgrade\.js(\?v=\d+)?"/.test(html), "aaa-upgrade.js linked");
assert(/src="gameplay-plus\.js(\?v=\d+)?"/.test(html), "gameplay-plus.js linked");
assert(html.includes("pityCount"), "scout pity state");
assert(html.includes("merchLevel"), "merch line state");
assert(html.includes("autoGreenlight"), "auto-greenlight state");
assert(html.includes("marketShare"), "market share state");
assert(html.includes("applyAudioSettings"), "audio settings");
assert(/src="gameplay-ultra\.js(\?v=\d+)?"/.test(html), "gameplay-ultra.js linked");
assert(/src="gameplay-endless\.js(\?v=\d+)?"/.test(html), "gameplay-endless.js linked");
assert(html.includes("endlessRisk"), "endless risk state");
assert(html.includes("endlessDiff"), "endless difficulty state");
assert(html.includes("projectStars"), "projectStars on hook");
assert(/src="gameplay-empire\.js(\?v=\d+)?"/.test(html), "gameplay-empire.js linked");
assert(html.includes("namedStaff"), "named staff state");
assert(html.includes("pullStar"), "pullStar on hook");
assert(/src="gameplay-studio\.js(\?v=\d+)?"/.test(html), "gameplay-studio.js linked");
assert(html.includes("sparks"), "spark currency state");
assert(html.includes("__AST_CONFIRM__"), "in-theme confirm hook");
assert(/src="gameplay-final\.js(\?v=\d+)?"/.test(html), "gameplay-final.js linked");
assert(html.includes("influence"), "influence currency state");
assert(html.includes("streaming"), "streaming contracts state");
assert(html.includes("_finalReleaseMult"), "final release multiplier");
assert(/src="gameplay-aaa\.js(\?v=\d+)?"/.test(html), "gameplay-aaa.js linked");
assert(html.includes("dynastyPoints"), "dynasty points state");
assert(html.includes("festivalWins"), "festival wins state");
assert(html.includes("_aaaReleaseMult"), "aaa release multiplier");
assert(html.includes("window.ACHIEVEMENTS"), "achievements exposed for aaa popups");
assert(/src="gameplay-legend\.js(\?v=\d+)?"/.test(html), "gameplay-legend.js linked");
assert(html.includes("dynastyPerks"), "dynasty perks state");
assert(html.includes("_legendReleaseMult"), "legend release multiplier");
assert(/src="hud-premium\.js(\?v=\d+)?"/.test(html), "hud-premium.js linked");
assert(html.includes("hud-premium.css"), "hud-premium.css linked");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("pathway-rail"), "pathway rail in hud script");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("hud-v3"), "hud v3 shell");
assert(/src="ui-complete\.js(\?v=\d+)?"/.test(html), "ui-complete.js linked");
assert(readFileSync(join(root, "ui-complete.js"), "utf8").includes("ui-tab-hero"), "tab hero layouts");
assert(/src="gameplay-studio-rating\.js(\?v=\d+)?"/.test(html), "gameplay-studio-rating.js linked");
assert(html.includes("gameplay-studio-rating.css"), "gameplay-studio-rating.css linked");
assert(html.includes("studioStars"), "studio star rating state");
assert(html.includes("starUnlock"), "project star gates");
assert(readFileSync(join(root, "gameplay-studio-rating.js"), "utf8").includes("jw-studio-rank"), "JW rating HUD");
assert(/src="hook-bridge\.js(\?v=\d+)?"/.test(html), "hook-bridge.js linked");
assert(readFileSync(join(root, "hook-bridge.js"), "utf8").includes("__globalsRebound"), "hook global rebind");
assert(readFileSync(join(root, "gameplay-aaa.js"), "utf8").includes("__aaaLayerInstalled"), "aaa layer install flag");
assert(html.includes("hire,") && html.includes("expandStudio,"), "hire/expand on hook");
assert(/src="gameplay-polish\.js(\?v=\d+)?"/.test(html), "gameplay-polish.js linked");
assert(html.includes("crisisSnoozeUntil"), "crisis snooze state");
assert(html.includes('id:"rat5"'), "studio rating achievements");
assert(!html.includes('href="studio-premium.css'), "studio-premium.css disabled (ast-v5)");
assert(!html.includes('href="gameplay-plus.css'), "gameplay-plus.css disabled (ast-v5)");
assert(!html.includes('href="game-skin.css'), "game-skin.css not linked (ast-v5 authority)");
assert(!html.includes('href="hf-design.css'), "hf-design.css disabled (ast-v5)");
assert(!html.includes('href="aaa-ui.css'), "aaa-ui.css disabled (ast-v5)");
assert(html.includes("legacy-fx.css"), "legacy-fx css linked");
assert(html.includes("ast-v5.css"), "ast-v5 design css linked");
assert(html.includes("build 73"), "build 73 tag");
assert(html.includes("Production Score"), "production score label");
assert(html.includes("CSS Prune"), "whatsnew build 73 changelog");
const astCss = readFileSync(join(root, "ast-v5.css"), "utf8");
const astLines = astCss.split("\n").length;
assert(astLines < 3200, "ast-v5.css pruned under 3200 lines", `${astLines} lines`);
assert(astCss.includes("BUILD 73 — CSS Prune"), "build 73 css marker");
assert(!astCss.includes("BUILD 55 —"), "dead build 55 section removed");
assert(existsSync(join(root, "scripts/prune-ast-v5.mjs")), "prune script exists");
assert(readFileSync(join(root, "ast-v5.css"), "utf8").includes("--gl-card-w"), "greenlight layout tokens");
assert(readFileSync(join(root, "ast-v5.css"), "utf8").includes("aaa-gl-page .aaa-gl-carousel"), "scoped gl carousel canon");
assert(html.includes("scrollIntoView"), "carousel center scrollIntoView");
assert(html.includes("aaa-hero-block"), "unified produce hero block");
assert(html.includes("POSTER_META"), "poster overlay metadata");
assert(html.includes("fmtYenCompact"), "compact yen formatting");
assert(html.includes("scrollSelectedGlCard"), "greenlight carousel center snap");
assert(html.includes("aaa-gl-slots-plus"), "greenlight slots expand button");
assert(html.includes("TAB_ORDER_EARLY"), "mockup tab order");
assert(html.includes("hypeCap"), "hype cap display");
assert(html.includes("isGreenlightView"), "greenlight view state");
assert(html.includes("syncMainViewState"), "main view dataset sync");
assert(readFileSync(join(root, "aaa-upgrade.js"), "utf8").includes("fx-canvas-off"), "fx canvas off in hud v3");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("hud-back-btn"), "hud back button");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("hud-gl-view"), "context stat toggle");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("directors increases final score"), "coach director tip");
assert(html.includes("TAB_MOCKUP"), "mockup tab labels");
assert(html.includes("Sakura Films"), "default studio name from ref");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("hud-mail-btn"), "hud mail button");
assert(html.includes("GENRE_ICONS"), "genre filter icons");
assert(html.includes("aaa-gl-confirm-banner"), "greenlight banner CTA");
assert(html.includes("aaa-gl-name-ja"), "showcase japanese titles");
assert(html.includes("v5-slim-gate.js"), "v5 slim gate linked");
assert(html.includes("aaa-ep-pill"), "EP pill on stats panel");
assert(html.includes("studioRankLetter"), "studio rank letter helper");
assert(existsSync(join(root, "v5-slim-gate.js")), "v5-slim-gate.js exists");
assert(html.includes("GREENLIGHT_SHOWCASE"), "greenlight showcase catalog");
assert(html.includes("renderGreenlightPage"), "full-screen greenlight page");
assert(html.includes("aaa-gl-page"), "greenlight page class");
assert(html.includes("greenlight-view"), "greenlight view toggle");
assert(html.includes("aaa-gl-carousel"), "greenlight carousel");
assert(html.includes("aaa-gl-detail"), "greenlight analytics deck");
assert(readFileSync(join(root, "v5-render-guard.js"), "utf8").includes("aaa-tab-page"), "nuclear main guard");
assert(!html.includes('href="gameplay-studio-rating.css'), "studio-rating css disabled");
assert(!readFileSync(join(root, "hud-premium.js"), "utf8").includes("coach-mail"), "coach mail removed");
assert(html.includes("aaa-premiere-bonus-label"), "mockup premiere bonus label");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes('type: "hire"'), "coach one-tap hire");
assert(html.includes("S.releases<=3"), "early premiere celebration");
assert(html.includes("aaa-research-hero"), "research glass hero");
assert(html.includes("aaa-minigame-panel"), "minigame glass panel");
assert(readFileSync(join(root, "ast-v5.css"), "utf8").includes("#loading-splash"), "loading splash in ast-v5");
assert(html.includes("START PRODUCTION")||html.includes("quick-greenlight"), "ultra-simple first greenlight");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes('type: "premiere"'), "coach one-tap premiere");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes('type: "claim-reward"'), "coach one-tap claim");
assert(html.includes("quickGreenlight,"), "quickGreenlight on hook");
assert(html.includes("claimFirstReward,"), "claimFirstReward on hook");
assert(html.includes("aaa-staff-rank"), "staff rank badges");
assert(html.includes("aaa-quest-hero"), "quests glass hero");
assert(html.includes("v5-render-guard.js"), "v5 render guard linked");
assert(readFileSync(join(root, "hook-bridge.js"), "utf8").includes("__v5GuardInstalled"), "v5 guard in hook bridge");
assert(readFileSync(join(root, "v5-render-guard.js"), "utf8").includes("smart-cast-bar"), "smart-cast guard fix");
assert(html.includes("bootstrapNewStudio"), "new player bootstrap");
assert(html.includes("ensurePlayable"), "stuck save repair");
assert(html.includes("quick-greenlight"), "quick greenlight button");
assert(html.includes("tabVisible"), "progressive tab unlock");
assert(html.includes("hireCost,"), "hireCost on hook for tab badges");
assert(html.includes("estimatePremiere"), "premiere bonus estimator");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("coach-gift"), "coach gift button");
assert(html.includes("premium-hud"), "early premium-hud class");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("hud-studio-rating"), "rating in hud shell");
assert(html.includes("seasonClaimed"), "season pass state");
assert(html.includes('id="main"></div>'), "clean #main shell");
assert(html.includes("BUILD_TAG"), "build tag constant");
assert(html.includes("whatsnew"), "what's new modal");

const rawCount = (html.match(/__raw/g) || []).length;
assert(rawCount <= 2, "single __raw redirect script", `found ${rawCount}`);

for (const f of ["strings.js", "logic.js", "aaa-upgrade.js", "gameplay-plus.js", "gameplay-ultra.js", "gameplay-endless.js", "gameplay-empire.js", "gameplay-studio.js", "gameplay-final.js", "gameplay-aaa.js", "gameplay-legend.js", "hud-premium.js", "ui-complete.js", "gameplay-studio-rating.js", "gameplay-polish.js", "v5-render-guard.js", "hook-bridge.js"]) {
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