#!/usr/bin/env node
/**
 * Honest-flow simulation — loads core logic from index.html via vm and
 * walks a minimal playthrough: bootstrap → hire → greenlight → tap boost → premiere.
 *
 * Run: node scripts/playtest-sim.mjs
 */
import { readFileSync } from "fs";
import vm from "vm";
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
function assert(cond, name, msg = "failed") {
  if (cond) ok(name);
  else fail(name, msg);
}

function mockEl() {
  const kids = [];
  return {
    style: { display: "none" },
    textContent: "",
    innerHTML: "",
    onclick: null,
    onchange: null,
    value: "",
    classList: { add() {}, remove() {} },
    offsetWidth: 0,
    removeAttribute() {},
    remove() {},
    dataset: {},
    tagName: "DIV",
    appendChild(c) {
      kids.push(c);
      return c;
    },
    querySelector: () => mockEl(),
    querySelectorAll: () => [],
  };
}

function buildSandbox() {
  const store = {};
  const doc = {
    querySelector: () => mockEl(),
    getElementById: () => mockEl(),
    createElement: () => mockEl(),
    addEventListener: () => {},
    removeEventListener: () => {},
    querySelectorAll: () => [],
  };
  const sandbox = {
    window: {},
    document: doc,
    localStorage: {
      getItem: (k) => store[k] || null,
      setItem: (k, v) => {
        store[k] = v;
      },
    },
    location: { search: "", hostname: "localhost", pathname: "/" },
    history: { replaceState() {} },
    addEventListener: () => {},
    removeEventListener: () => {},
    setTimeout: () => 0,
    clearTimeout: () => {},
    setInterval: () => 0,
    clearInterval: () => {},
    requestAnimationFrame: () => 0,
    cancelAnimationFrame: () => {},
    fetch: async () => ({ json: async () => ({ ok: false }) }),
    Date,
    Math,
    console,
    JSON,
    parseInt,
    parseFloat,
    isFinite,
    isNaN,
    Array,
    Object,
    String,
    Number,
    Boolean,
    RegExp,
    Map,
    Set,
    Promise,
    Error,
    Intl,
    URL,
    URLSearchParams,
    performance: { now: () => Date.now() },
    STR: {
      muteOn: "On",
      muteOff: "Off",
      save: "Save",
      reset: "Reset",
      privacy: "Privacy",
      terms: "Terms",
      share: "Share",
      startPlay: "Play",
      startDemo: "Demo",
      tagline: "",
      language: "Language",
      tab_produce: "Produce",
      tab_quests: "Quests",
      tab_staff: "Staff",
      tab_stars: "Stars",
      tab_research: "Research",
      tab_studio: "Studio",
      tab_market: "Market",
      tab_store: "Store",
      h_daily: "Daily",
      h_weekly: "Weekly",
      claim: "Claim",
      __code: "en",
    },
    LANGS: { en: {} },
    LANG_NAMES: { en: "English" },
    setLang: () => "en",
    initialLang: () => "en",
    t: (_k, fb) => fb || _k,
  };
  sandbox.window = sandbox;
  return sandbox;
}

function loadLogicForVm() {
  let code = readFileSync(join(root, "logic.js"), "utf8");
  code = code
    .replace(/^export const /gm, "const ")
    .replace(/^export function /gm, "function ");
  return code;
}

function extractGameLogic() {
  const html = readFileSync(join(root, "index.html"), "utf8");
  const m = html.match(/<script type="module">([\s\S]*?)<\/script>/);
  if (!m) throw new Error("index.html game script block not found");
  let code = m[1]
    .replace(/^import[\s\S]*?from\s+["'][^"']+["'];\s*/gm, "")
    .replace(/^window\.__AST_LOGIC__\s*=\s*\{[\s\S]*?\};\s*/m, "")
    .replace(/^setLang\(initialLang\(\)\);\s*/m, "");
  const cut = code.indexOf("const loaded=load();");
  if (cut < 0) throw new Error("game script cut marker missing");
  return loadLogicForVm() + "\n" + code.slice(0, cut);
}

const STUBS = `
render = function(){};
save = function(){};
toast = function(){};
toastSafe = function(){};
play = function(){};
floatGain = function(){};
track = function(){};
celebrateFirstHire = function(){};
celebrateFirstExpand = function(){};
celebrateFirstResearch = function(){};
celebrateCollect = function(){};
celebrateCampaignRun = function(){};
celebrateStudioAward = function(){};
showPremiere = function(){};
maybeDecision = function(){};
drainUnlockModalQueue = function(){ return false; };
checkAchievements = function(){};
checkFanMilestoneToasts = function(){};
checkStudioLevel = function(){};
awardMilestoneGems = function(){};
registerFranchiseHit = function(){};
processCast = function(){};
studioAwards = function(){};
`;

const SIM_RUNNER = `
S = freshState();
OFFLINE = true;
const shortFilm = PROJECTS[0];
const snap = {
  yen0: S.yen,
  fans0: S.fans,
  releases0: S.releases,
  booted: bootstrapHonestStudio(),
  demoMode: S._demoMode,
  guidedFresh: S._guidedFresh,
  hireCostAnimator: hireCost("animator"),
};
hire("animator");
snap.yenAfterHire = S.yen;
snap.staffAnimator = S.staff.animator;
const yenBeforeGl = S.yen;
greenlight(shortFilm.id, "Action", [], null);
snap.yenAfterGl = S.yen;
snap.active = activeCount();
const pr = S.projects[0];
snap.progress0 = pr.progress;
snap.ppt = powerPerTick();
tapBoost(0);
snap.progressAfterTap = pr.progress;
snap.tapGain = pr.progress - snap.progress0;
const beforeTick = pr.progress;
tick(1);
snap.progressAfterTick = pr.progress;
snap.tickGain = pr.progress - beforeTick;
pr.progress = shortFilm.work;
const fansBeforePrem = S.fans;
releaseProject(0);
snap.releasesAfter = S.releases;
snap.fansAfterPrem = S.fans;
snap.fansGain = S.fans - fansBeforePrem;
snap.slotCleared = S.projects[0] === null;
snap.studioUnlocked = featureUnlocked("studio");
snap.starsUnlocked = featureUnlocked("stars");
snap.marketUnlocked = featureUnlocked("market");
snap.chaosUnlocked = UNLOCKS.chaos.test();
__SIM_RESULT__ = snap;
`;

function runVmSimulation() {
  const sandbox = buildSandbox();
  vm.runInNewContext(extractGameLogic() + STUBS + SIM_RUNNER, sandbox, { timeout: 20000 });
  return sandbox.__SIM_RESULT__;
}

const UNLOCK_GATE_RUNNER = `
S = freshState();
const gates = { release0: {}, release1: {}, fans49: {}, fans50: {} };

gates.release0.studio = featureUnlocked("studio");
gates.release0.slots = S.slots;
S.yen = 50000;
expandStudio();
gates.release0.slotsAfterExpand = S.slots;

S = freshState();
S.releases = 1;
gates.release1.studio = featureUnlocked("studio");
gates.release1.expandCost = expandCost();
S.yen = 50000;
const yen0 = S.yen;
const slots0 = S.slots;
expandStudio();
gates.release1.slotsAfter = S.slots;
gates.release1.yenSpent = yen0 - S.yen;
gates.release1.expandWorked = S.slots === slots0 + 1;

S = freshState();
S.fans = 49;
gates.fans49.market = featureUnlocked("market");
S.fans = 50;
gates.fans50.market = featureUnlocked("market");

__UNLOCK_GATES__ = gates;
`;

function runUnlockGateSimulation() {
  const sandbox = buildSandbox();
  vm.runInNewContext(extractGameLogic() + STUBS + UNLOCK_GATE_RUNNER, sandbox, { timeout: 20000 });
  return sandbox.__UNLOCK_GATES__;
}

function assertHonestFlow(snap) {
  assert(snap.yen0 === 1500, "fresh honest yen", `got ${snap.yen0}`);
  assert(snap.releases0 === 0, "fresh releases zero");
  assert(snap.fans0 === 0, "fresh fans zero");
  assert(snap.booted === true, "bootstrapHonestStudio succeeds on empty studio");
  assert(snap.demoMode === false, "honest bootstrap clears demo flag");
  assert(snap.guidedFresh === true, "honest bootstrap sets guided fresh");
  assert(snap.hireCostAnimator === 200, "first animator hire cost", `got ${snap.hireCostAnimator}`);
  assert(snap.staffAnimator === 1, "animator hired");
  assert(snap.yenAfterHire === snap.yen0 - snap.hireCostAnimator, "yen decreases on hire", `${snap.yenAfterHire}`);
  assert(snap.yenAfterGl === snap.yenAfterHire - 100, "yen decreases on greenlight", `${snap.yenAfterGl}`);
  assert(snap.active === 1, "project active after greenlight");

  const expectedTap = Math.min(
    50 - snap.progress0,
    Math.max(5, Math.max(2, snap.ppt * 0.5))
  );
  assert(snap.tapGain === expectedTap, "tap boost math (first-release floor)", `+${snap.tapGain} vs +${expectedTap}`);
  assert(snap.ppt > 0, "powerPerTick positive after hire", `ppt=${snap.ppt}`);
  assert(snap.tickGain > 0, "tick advances production progress");
  assert(snap.releasesAfter === 1, "releases 0→1", `got ${snap.releasesAfter}`);
  assert(snap.fansGain > 0, "fans increase on premiere", `+${snap.fansGain}`);
  assert(snap.slotCleared === true, "slot cleared after premiere");
  assert(snap.studioUnlocked === true, "studio unlock after first premiere");
  assert(snap.starsUnlocked === false, "stars still locked after first premiere");
  assert(snap.marketUnlocked === false, "market locked before 50 fans");
  assert(snap.chaosUnlocked === false, "chaos locked before 10 releases");
}

function assertUnlockGates(gates) {
  assert(gates.release0.studio === false, "studio locked at release 0");
  assert(
    gates.release0.slotsAfterExpand === gates.release0.slots,
    "expand no-op before release 1",
    `slots ${gates.release0.slots} → ${gates.release0.slotsAfterExpand}`
  );
  assert(gates.release1.studio === true, "studio unlocked at release 1");
  assert(gates.release1.expandWorked === true, "expand succeeds at release 1 with yen");
  assert(
    gates.release1.yenSpent === gates.release1.expandCost,
    "expand costs yen at release 1",
    `spent ${gates.release1.yenSpent} vs cost ${gates.release1.expandCost}`
  );
  assert(gates.fans49.market === false, "market locked at 49 fans");
  assert(gates.fans50.market === true, "market unlocked at 50 fans");
}

function staticSaveSchemaAudit() {
  const logic = readFileSync(join(root, "logic.js"), "utf8");
  const html = readFileSync(join(root, "index.html"), "utf8");
  const requiredKeys = [
    "yen: 1500",
    "releases: 0",
    "slots: 1",
    "animator: 0",
    "projects: [null]",
    "_guidedFresh: false",
    "_demoMode: false",
    "catalogIncome: 0",
    "mastery: Object.fromEntries(genres.map",
  ];
  for (const key of requiredKeys) {
    assert(logic.includes(key), `save schema field: ${key.split(":")[0].trim()}`);
  }

  assert(html.includes('from "./logic.js"'), "index.html imports logic.js");

  const unlockOrder = [
    "studio:  { label:",
    "releases: 1",
    "stars:   { label:",
    "releases: 2",
    "totalFansEver: 20",
    "market:  { label:",
    "fans: 50",
    "research:{ label:",
    "totalFansEver: 120",
    "chaos:   { label:",
    "releases: 10",
  ];
  for (const snippet of unlockOrder) {
    assert(logic.includes(snippet), `unlock gate: ${snippet.split(":")[0].trim()}`);
  }
}

console.log("Anime Studio Tycoon — playtest sim (honest flow)\n");

try {
  const snap = runVmSimulation();
  assertHonestFlow(snap);
} catch (e) {
  fail("vm honest-flow sim", e.message || String(e));
}

console.log("\nUnlock gate state checks (expand @ release 1, market @ 50 fans):\n");
try {
  const gates = runUnlockGateSimulation();
  assertUnlockGates(gates);
} catch (e) {
  fail("vm unlock-gate sim", e.message || String(e));
}

console.log("\nStatic save schema + unlock order:\n");
staticSaveSchemaAudit();

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);