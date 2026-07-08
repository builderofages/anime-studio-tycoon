#!/usr/bin/env node
/**
 * Honest-flow static audit — verifies core play hooks exist and overlay modals are wired.
 * Run: node scripts/playtest-audit.mjs
 */
import { readFileSync } from "fs";
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

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);