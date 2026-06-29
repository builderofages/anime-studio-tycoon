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
assert(html.includes("seasonClaimed"), "season pass state");
assert(html.includes('id="main"></div>'), "clean #main shell");
assert(html.includes("BUILD_TAG"), "build tag constant");
assert(html.includes("whatsnew"), "what's new modal");

const rawCount = (html.match(/__raw/g) || []).length;
assert(rawCount <= 2, "single __raw redirect script", `found ${rawCount}`);

for (const f of ["strings.js", "logic.js", "aaa-upgrade.js", "gameplay-plus.js", "gameplay-ultra.js", "gameplay-endless.js", "gameplay-empire.js"]) {
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
assert(existsSync(join(root, "www/gameplay-empire.js")), "www/gameplay-empire.js copied");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);