#!/usr/bin/env node
/**
 * Honest-flow static audit — verifies core play hooks exist and overlay modals are wired.
 * Run: node scripts/playtest-audit.mjs
 */
import { existsSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0;
let failed = 0;

function ok(name) {
  passed++;
  console.log(`  ✓ ${name}`);
}
function fail(name, msg) {
  failed++;
  console.error(`  ✗ ${name}: ${msg}`);
}
function assert(cond, name, msg = "missing") {
  if (cond) ok(name);
  else fail(name, msg);
}

const html = readFileSync(join(root, "index.html"), "utf8");
const logic = readFileSync(join(root, "logic.js"), "utf8");
const sources = [
  "index.html",
  "hud-premium.js",
  "hook-bridge.js",
  "gameplay-polish.js",
  "gameplay-studio-rating.js",
  "gameplay-plus.js",
  "gameplay-ultra.js",
  "gameplay-endless.js",
];
const bundle = sources.map((f) => readFileSync(join(root, f), "utf8")).join("\n");

console.log("Anime Studio Tycoon — playtest audit (honest flow)\n");

/** Core functions a fresh ¥1,500 playthrough must expose. */
const HONEST_FLOW_FUNCTIONS = [
  "bootstrapHonestStudio",
  "bootstrapDemoStudio",
  "isDemoMode",
  "isGuidedTutorialEligible",
  "completeTutorial",
  "drainUnlockModalQueue",
  "celebrationOverlayOpen",
  "featureUnlocked",
  "tabAccessible",
  "releaseProject",
  "showOfflineModal",
  "maybeShowReturnHub",
  "closeReturnHub",
  "maybeDecision",
  "queueStudioUnlockModal",
  "queueStarsUnlockModal",
  "queueResearchUnlockModal",
  "queueMarketUnlockModal",
  "queueChaosUnlockModal",
  "hire",
  "expandStudio",
  "renderGreenlightPage",
  "slotEtaSeconds",
  "save",
  "render",
];

for (const fn of HONEST_FLOW_FUNCTIONS) {
  const inHtml =
    html.includes(`function ${fn}`) ||
    html.includes(`function ${fn}(`) ||
    html.includes(`${fn}=function`) ||
    html.includes(`${fn} = function`);
  assert(inHtml, `honest-flow: ${fn}`, `not defined in index.html`);
}

/** Mobile audio + return-hub boot batching. */
const MOBILE_AUDIO_FUNCTIONS = ["resumeAudioCtx", "playSynth", "play"];
for (const fn of MOBILE_AUDIO_FUNCTIONS) {
  assert(
    html.includes(`function ${fn}`) || html.includes(`function ${fn}(`),
    `mobile-audio: ${fn}`,
    `not defined in index.html`
  );
}
assert(html.includes("SYNTH_SFX_KEYS"), "synth sfx registry");
assert(html.includes('"tab-switch"'), "tab-switch synth profile");
assert(html.includes('id="return-hub"'), "return-hub overlay in DOM");
assert(
  html.includes("maybeShowReturnHub({returnSec,returnR,dr,had})"),
  "return-hub wired in boot flow"
);
assert(
  bundle.includes('getElementById("return-hub")'),
  "return-hub getElementById reference"
);
assert(
  html.includes("celebrateCollect") && html.includes('"return-hub"'),
  "return-hub collect celebration path"
);

assert(
  html.includes('featureUnlocked("studio")&&S.slots<MAX_SLOTS'),
  "GL expand gated on studio unlock"
);

const overlayIds = [
  ...html.matchAll(/<div class="overlay[^"]*" id="([^"]+)"/g),
].map((m) => m[1]);

assert(overlayIds.length >= 18, "overlay modals present", `found ${overlayIds.length}`);

for (const id of overlayIds) {
  const wired =
    bundle.includes(`getElementById("${id}")`) ||
    bundle.includes(`getElementById('${id}')`) ||
    bundle.includes(`#${id}`);
  assert(wired, `modal wired: ${id}`, "no getElementById reference in game sources");
}

const celebrationMatch = html.match(/CELEBRATION_OVERLAY_IDS=\[([^\]]+)\]/);
assert(!!celebrationMatch, "CELEBRATION_OVERLAY_IDS constant");
if (celebrationMatch) {
  const ids = celebrationMatch[1].match(/"([^"]+)"/g)?.map((s) => s.slice(1, -1)) || [];
  for (const id of ids) {
    assert(overlayIds.includes(id), `celebration overlay in DOM: ${id}`);
  }
}

/** Dynamically created overlays must still be referenced. */
for (const dynId of ["starter", "guided-tutorial", "aaa-achieve-pop"]) {
  assert(
    bundle.includes(`getElementById("${dynId}")`) || bundle.includes(`id="${dynId}"`),
    `dynamic overlay wired: ${dynId}`
  );
}

assert(html.includes('from "./logic.js"'), "index.html imports logic.js");

/** Honest bootstrap + save schema anchors (complemented by playtest-sim.mjs vm run). */
const SAVE_SCHEMA_KEYS = [
  "yen: 1500",
  "releases: 0",
  "slots: 1",
  "animator: 0",
  "projects: [null]",
  "_guidedFresh: false",
  "catalogIncome: 0",
];
for (const key of SAVE_SCHEMA_KEYS) {
  assert(logic.includes(key), `honest save schema: ${key.split(":")[0].trim()}`);
}

const UNLOCK_SNIPPETS = [
  "studio:  { label:",
  "releases: 1",
  "stars:   { label:",
  "releases: 2",
  "market:  { label:",
  "fans: 50",
  "research:{ label:",
  "totalFansEver: 120",
  "chaos:   { label:",
  "releases: 10",
];
for (const snippet of UNLOCK_SNIPPETS) {
  assert(logic.includes(snippet), `unlock order: ${snippet.split(":")[0].trim()}`);
}

assert(html.includes("tapBoost(slot)"), "tap boost production hook");
assert(html.includes("if((S.releases||0)<1) amt=Math.min"), "first-release tap floor");
assert(existsSync(join(root, "scripts/playtest-sim.mjs")), "playtest sim script present");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);