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

const STUBS_BASE = `
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
checkAchievements = function(){};
checkFanMilestoneToasts = function(){};
checkStudioLevel = function(){};
awardMilestoneGems = function(){};
registerFranchiseHit = function(){};
processCast = function(){};
studioAwards = function(){};
`;

const STUBS = STUBS_BASE + `
drainUnlockModalQueue = function(){ return false; };
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

const DEMO_BOOTSTRAP_RUNNER = `
S = freshState();
const demo = {
  booted: bootstrapDemoStudio(),
  demoMode: S._demoMode,
  yen: S.yen,
  fans: S.fans,
  staffTotal: staffTotal(),
  slots: S.slots,
  studioStars: S.studioStars,
};
__DEMO_BOOTSTRAP__ = demo;
`;

function runDemoBootstrapSimulation() {
  const sandbox = buildSandbox();
  vm.runInNewContext(extractGameLogic() + STUBS + DEMO_BOOTSTRAP_RUNNER, sandbox, { timeout: 20000 });
  return sandbox.__DEMO_BOOTSTRAP__;
}

const STARS_UNLOCK_RUNNER = `
S = freshState();
const stars = { r0: {}, r1: {}, r2: {}, fans20: {} };
stars.r0.unlocked = featureUnlocked("stars");
stars.r0.tabLocked = tabLocked("stars");
S.releases = 1;
stars.r1.unlocked = featureUnlocked("stars");
stars.r1.tabLocked = tabLocked("stars");
S.releases = 2;
stars.r2.unlocked = featureUnlocked("stars");
stars.r2.tabLocked = tabLocked("stars");
S = freshState();
S.totalFansEver = 20;
stars.fans20.unlocked = featureUnlocked("stars");
__STARS_UNLOCK__ = stars;
`;

function runStarsUnlockSimulation() {
  const sandbox = buildSandbox();
  vm.runInNewContext(extractGameLogic() + STUBS + STARS_UNLOCK_RUNNER, sandbox, { timeout: 20000 });
  return sandbox.__STARS_UNLOCK__;
}

const TAP_BOOST_RUNNER = `
S = freshState();
bootstrapHonestStudio();
hire("animator");
const shortFilm = PROJECTS[0];
greenlight(shortFilm.id, "Action", [], null);
const pr = S.projects[0];
const before = pr.progress;
tapBoost(0);
__TAP_BOOST__ = {
  before,
  after: pr.progress,
  gain: pr.progress - before,
  ppt: powerPerTick(),
};
`;

function runTapBoostSimulation() {
  const sandbox = buildSandbox();
  vm.runInNewContext(extractGameLogic() + STUBS + TAP_BOOST_RUNNER, sandbox, { timeout: 20000 });
  return sandbox.__TAP_BOOST__;
}

const DRAIN_QUEUE_RUNNER = `
S = freshState();
const drain = { types: {} };
drain.empty = drainUnlockModalQueue();
S.releases = 1;
_studioUnlockQueued = true;
drain.studioQueued = drainUnlockModalQueue();
drain.types.empty = typeof drain.empty;
drain.types.studioQueued = typeof drain.studioQueued;
__DRAIN_QUEUE__ = drain;
`;

function runDrainQueueSimulation() {
  const sandbox = buildSandbox();
  vm.runInNewContext(extractGameLogic() + STUBS_BASE + DRAIN_QUEUE_RUNNER, sandbox, { timeout: 20000 });
  return sandbox.__DRAIN_QUEUE__;
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

function assertDemoBootstrap(demo) {
  assert(demo.booted === true, "bootstrapDemoStudio succeeds on empty studio");
  assert(demo.demoMode === true, "demo bootstrap sets _demoMode");
  assert(demo.yen >= 1000000, "demo bootstrap has inflated yen", `yen=${demo.yen}`);
  assert(demo.yen >= 23700000, "demo bootstrap yen near showcase seed", `got ${demo.yen}`);
  assert(demo.fans > 10000, "demo bootstrap has inflated fans", `fans=${demo.fans}`);
  assert(demo.staffTotal > 0, "demo bootstrap pre-hires staff");
  assert(demo.slots >= 3, "demo bootstrap expands slots", `slots=${demo.slots}`);
  assert(demo.studioStars === 5, "demo bootstrap max studio stars", `got ${demo.studioStars}`);
}

function assertStarsUnlock(stars) {
  assert(stars.r0.unlocked === false, "stars locked at release 0");
  assert(stars.r0.tabLocked === true, "tabLocked(stars) true at release 0");
  assert(stars.r1.unlocked === false, "stars locked at release 1");
  assert(stars.r1.tabLocked === true, "tabLocked(stars) true at release 1");
  assert(stars.r2.unlocked === true, "stars unlock at 2 releases");
  assert(stars.r2.tabLocked === false, "tabLocked(stars) false at release 2");
  assert(stars.fans20.unlocked === true, "stars unlock at 20 totalFansEver alt gate");
}

function assertTapBoost(tap) {
  assert(tap.before >= 0, "tap boost baseline progress valid");
  assert(tap.gain > 0, "tapBoost increases progress", `+${tap.gain}`);
  assert(tap.after === tap.before + tap.gain, "tap boost progress delta");
  assert(tap.ppt > 0, "powerPerTick positive for tap math");
}

function assertDrainQueue(drain) {
  assert(drain.types.empty === "boolean", "drainUnlockModalQueue returns boolean (empty)");
  assert(drain.types.studioQueued === "boolean", "drainUnlockModalQueue returns boolean (queued)");
  assert(drain.empty === false, "drainUnlockModalQueue false when queue empty");
  assert(drain.studioQueued === true, "drainUnlockModalQueue true when studio unlock queued");
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

console.log("\nDemo bootstrap (_demoMode + inflated yen):\n");
try {
  const demo = runDemoBootstrapSimulation();
  assertDemoBootstrap(demo);
} catch (e) {
  fail("vm demo-bootstrap sim", e.message || String(e));
}

console.log("\nStars unlock @ 2 releases + tabLocked:\n");
try {
  const stars = runStarsUnlockSimulation();
  assertStarsUnlock(stars);
} catch (e) {
  fail("vm stars-unlock sim", e.message || String(e));
}

console.log("\ntapBoost progress delta:\n");
try {
  const tap = runTapBoostSimulation();
  assertTapBoost(tap);
} catch (e) {
  fail("vm tap-boost sim", e.message || String(e));
}

console.log("\ndrainUnlockModalQueue boolean return:\n");
try {
  const drain = runDrainQueueSimulation();
  assertDrainQueue(drain);
} catch (e) {
  fail("vm drain-queue sim", e.message || String(e));
}

console.log("\nStatic save schema + unlock order:\n");
staticSaveSchemaAudit();

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);