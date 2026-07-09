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
  "tabLocked",
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
  "_demoMode: false",
  "catalogIncome: 0",
  "redeemedCodes: []",
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
assert(html.includes("redeemedCodes.includes(code)"), "redeem code one-time guard");
assert(html.includes("S._demoMode=true"), "demo bootstrap sets _demoMode");
assert(html.includes("S.yen=23800000"), "demo bootstrap inflated yen");
assert(html.includes('function tabLocked(k)'), "tab lock gate for dock tabs");
assert(
  html.includes("return false;") && html.match(/function drainUnlockModalQueue[\s\S]*?return true;/),
  "drainUnlockModalQueue returns boolean"
);
assert(existsSync(join(root, "scripts/playtest-sim.mjs")), "playtest sim script present");

/** Build 105 — game-feel SFX + greenlight celebration hooks. */
assert(html.includes("first-greenlight"), "synth sfx: first-greenlight");
assert(html.includes("unlock-open"), "synth sfx: unlock-open");
assert(html.includes("milestone-collect"), "synth sfx: milestone-collect");
assert(
  html.includes('"first-greenlight"') &&
    html.includes('"unlock-open"') &&
    html.includes('"milestone-collect"'),
  "synth sfx keys in SYNTH_SFX_KEYS registry"
);
assert(html.includes("celebrateGreenlightSlot"), "celebrateGreenlightSlot burst helper");

const playSimSrc = readFileSync(join(root, "scripts/playtest-sim.mjs"), "utf8");
assert(playSimSrc.includes("IAP_FETCH_MOCK"), "playtest-sim IAP_FETCH_MOCK coverage");

/** logic.js exports + extended save schema (parity with playtest-sim staticSaveSchemaAudit). */
const LOGIC_EXPORTS = [
  "makeUnlocks",
  "tabUnlockPctFor",
  "rivalGoalFromStart",
  "repairLoadedStateFor",
  "repairRivalGoalFor",
  "VALID_TABS",
  "starsUnlockProgressFor",
  "tabLockedFor",
  "masteryResearchCostFor",
  "mergeLoadedSave",
  "createFreshState",
  "DEFAULT_STAFF",
  "DEFAULT_QUEST_PROG",
  "UNLOCK_THRESHOLDS",
  "redeemedGrants: []",
  "totalFansEver: 20",
];
for (const key of LOGIC_EXPORTS) {
  assert(logic.includes(key), `logic export/schema: ${key.split(":")[0].trim()}`);
}

/** Production loop hooks — bootstrap → hire → greenlight → tap/tick → premiere. */
const PRODUCTION_HOOKS = [
  "function greenlight(",
  "function releaseProject(",
  "function tick(",
  "function powerPerTick(",
  "function hire(",
  "function expandStudio(",
  "function activeCount(",
  "function freshState(",
];
for (const hook of PRODUCTION_HOOKS) {
  assert(html.includes(hook), `production hook: ${hook.replace("function ", "").replace("(", "")}`);
}
assert(html.includes("expandCostFor"), "expandCostFor imported from logic.js");
assert(
  html.includes('if(!featureUnlocked("studio"))') && html.includes("function expandStudio("),
  "expandStudio gated on studio unlock"
);

/** Save/load persistence anchors. */
assert(html.includes('const SAVE_KEY = "anime_studio_tycoon_v1"'), "SAVE_KEY constant");
assert(html.includes("localStorage.setItem(SAVE_KEY"), "save writes localStorage");
assert(html.includes("localStorage.getItem(SAVE_KEY"), "load reads localStorage");
assert(html.includes("mergeLoadedSave"), "load merges via mergeLoadedSave");

/** IAP / redeem / grant entitlement hooks. */
const IAP_HOOKS = [
  "function grantEntitlement(",
  "async function redeemPurchaseToken(",
  "async function redeemLicenseKey(",
  "function readGrant(",
  "function grantWasRedeemed(",
  "function rememberGrantId(",
  "function clearGrantParams(",
];
for (const hook of IAP_HOOKS) {
  assert(html.includes(hook), `iap hook: ${hook.replace(/^(async )?function /, "").replace("(", "")}`);
}
assert(html.includes('"WELCOME":{gems:25}'), "WELCOME redeem code defined");
assert(html.includes("redeemedGrants"), "redeemedGrants grant idempotency field");

/** Unlock modal storm — queue flags + drain priority chain. */
const UNLOCK_QUEUE_FLAGS = [
  "_studioUnlockQueued",
  "_starsUnlockQueued",
  "_marketUnlockQueued",
  "_researchUnlockQueued",
  "_chaosUnlockQueued",
];
for (const flag of UNLOCK_QUEUE_FLAGS) {
  assert(html.includes(flag), `unlock queue flag: ${flag}`);
}
assert(html.includes("function unlockModalPending("), "unlockModalPending gate");
const drainBody = html.match(/function drainUnlockModalQueue\(\)\{[\s\S]*?return false;\s*\}/);
assert(!!drainBody, "drainUnlockModalQueue body");
if (drainBody) {
  const body = drainBody[0];
  const studioIdx = body.indexOf("_studioUnlockQueued");
  const starsIdx = body.indexOf("_starsUnlockQueued");
  const marketIdx = body.indexOf("_marketUnlockQueued");
  const researchIdx = body.indexOf("_researchUnlockQueued");
  const chaosIdx = body.indexOf("_chaosUnlockQueued");
  assert(
    studioIdx > 0 &&
      starsIdx > studioIdx &&
      marketIdx > starsIdx &&
      researchIdx > marketIdx &&
      chaosIdx > researchIdx,
    "modal storm priority: studio → stars → market → research → chaos"
  );
}
const UNLOCK_OVERLAY_IDS = [
  "studio-unlock",
  "stars-unlock",
  "market-unlock",
  "research-unlock",
  "chaos-unlock",
];
for (const id of UNLOCK_OVERLAY_IDS) {
  assert(html.includes(`id="${id}"`), `unlock overlay DOM: ${id}`);
}

/** Chaos / crisis decision flow. */
const CHAOS_HOOKS = [
  "function chaosBonus(",
  "function maybeChaos(",
  "function resolveDecision(",
  "function celebrateChaosSurvival(",
  "toggleChaosMode",
  "crisesSurvived",
  "awaitFirstChaosSurvival",
];
for (const hook of CHAOS_HOOKS) {
  assert(html.includes(hook), `chaos flow: ${hook.replace("function ", "")}`);
}
assert(html.includes('id="decision"'), "decision crisis overlay in DOM");
assert(html.includes("S.chaosMode?1.5:1"), "chaosBonus 1.5× when chaosMode on");

/** Offline earnings + return hub boot batching. */
assert(html.includes("function simulateOffline("), "simulateOffline hook");
assert(html.includes('id="offline"'), "offline overlay in DOM");
assert(html.includes("function returnHubOpen("), "returnHubOpen gate");
assert(html.includes("function bootBatchModalOpen("), "bootBatchModalOpen gate");
assert(html.includes("function closeReturnHub("), "closeReturnHub hook");
assert(
  html.includes("bootBatchModalOpen()") &&
    html.match(/function drainUnlockModalQueue[\s\S]*?celebrationOverlayOpen\(\)\) return false;/),
  "drainUnlockModalQueue blocks premiere, return hub, boot batch, and open celebrations"
);

/** Premiere queue while modal open. */
assert(html.includes("let _premiereQueue=") || html.includes("let _premiereQueue ="), "premiere queue array");
assert(html.includes("_premiereOpen"), "premiere modal open flag");
assert(html.includes("_premiereQueue.push"), "premiere queue push while modal open");
assert(html.includes('id="premiere"'), "premiere overlay in DOM");

/** Franchise sequel greenlight + registry. */
assert(html.includes("function registerFranchiseHit("), "registerFranchiseHit hook");
assert(html.includes("sequel&&sequel.base"), "sequel greenlight franchise base");
assert(html.includes("function franchiseList("), "franchiseList helper");

/** Prestige carry-over reset. */
assert(html.includes("function prestige("), "prestige hook");
assert(html.includes("legacy:S.legacy+gain"), "prestige accumulates legacy");
assert(html.includes("S.redeemedGrants=keep.redeemedGrants"), "prestige keeps redeemedGrants");
assert(html.includes("S.redeemedCodes=keep.redeemedCodes"), "prestige keeps redeemedCodes");

/** Rival HUD goal repair for corrupt saves. */
assert(html.includes("function ensureHudRival("), "ensureHudRival hook");
assert(
  logic.includes("export function repairRivalGoalFor") && html.includes("repairRivalGoalFor(S, studioValue())"),
  "rival goal repair when goal <= start"
);

/** Tutorial + what's new onboarding. */
assert(html.includes("function completeTutorial("), "completeTutorial hook");
assert(html.includes("function isGuidedTutorialEligible("), "isGuidedTutorialEligible hook");
assert(html.includes('id="whatsnew"'), "whatsnew overlay in DOM");
assert(html.includes("function shouldShowWhatsNew("), "shouldShowWhatsNew build gate");
assert(
  bundle.includes("guided-tutorial") || html.includes("guided-tutorial"),
  "guided-tutorial overlay reference"
);

/** playtest-sim VM runner parity — every critical flow has a sim harness. */
const SIM_RUNNERS = [
  "SIM_RUNNER",
  "UNLOCK_GATE_RUNNER",
  "DEMO_BOOTSTRAP_RUNNER",
  "SAVE_LOAD_RUNNER",
  "REDEEM_RUNNER",
  "IAP_RUNNER",
  "DOUBLE_IAP_RUNNER",
  "GRANT_PERSIST_RUNNER",
  "MODAL_STORM_RUNNER",
  "MODAL_STORM_FIVE_RUNNER",
  "CORRUPT_LOAD_RUNNER",
  "READ_GRANT_RUNNER",
  "CHAOS_RUNNER",
  "RESEARCH_UNLOCK_RUNNER",
  "FRANCHISE_RUNNER",
  "DYNASTY_PERK_RUNNER",
  "OFFLINE_RUNNER",
  "RETURN_HUB_RUNNER",
  "MODAL_PENDING_RUNNER",
  "BOOT_PRIORITY_RUNNER",
  "AWARD_DEFER_RUNNER",
  "PREMIERE_DEFER_RUNNER",
  "CHAOS_SURVIVAL_RUNNER",
  "EMPIRE_CRISIS_RUNNER",
  "PRESTIGE_RUNNER",
  "PREMIERE_QUEUE_RUNNER",
  "PREMIERE_QUEUE_MULTI_RUNNER",
  "COACH_LOCKED_TAB_RUNNER",
  "RIVAL_GOAL_RUNNER",
  "TUTORIAL_RUNNER",
];
for (const runner of SIM_RUNNERS) {
  assert(playSimSrc.includes(runner), `playtest-sim runner: ${runner}`);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);