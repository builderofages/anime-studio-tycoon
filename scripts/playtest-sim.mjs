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
  const cls = new Set();
  return {
    style: { display: "none" },
    textContent: "",
    innerHTML: "",
    onclick: null,
    onchange: null,
    value: "",
    hidden: false,
    classList: {
      add(...c) {
        c.forEach((x) => cls.add(x));
      },
      remove(...c) {
        c.forEach((x) => cls.delete(x));
      },
    },
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
  const docEl = mockEl();
  const doc = {
    documentElement: docEl,
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

/** Stubs that keep real save/load and franchise registration. */
const STUBS_PERSIST = STUBS_BASE.replace("registerFranchiseHit = function(){};\n", "") + `
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

const RIVAL_GOAL_RUNNER = `
S = freshState();
S.rivalWeek = weekKeyStr();
S.rivalStartVal = studioValue();
S.rivalGoal = 0;
S.rivalClaimed = false;
ensureHudRival();
__RIVAL_GOAL__ = {
  goal: S.rivalGoal,
  start: S.rivalStartVal,
  claimable: studioValue() < S.rivalGoal,
};
`;

function runRivalGoalSimulation() {
  const sandbox = buildSandbox();
  vm.runInNewContext(extractGameLogic() + STUBS_BASE + RIVAL_GOAL_RUNNER, sandbox, { timeout: 20000 });
  return sandbox.__RIVAL_GOAL__;
}

const PREMIERE_QUEUE_RUNNER = `
S = freshState();
_premiereOpen = true;
_premiereQueue = [];
const pr = { title: "Test Hit", genre: "Action", poster: "" };
const p = PROJECTS[0];
showPremiere(pr, p, 4, 1000, 50);
__PREMIERE_QUEUE__ = {
  len: _premiereQueue.length,
  held: _premiereQueue[0] && _premiereQueue[0].yenGain === 1000,
};
`;

const STUBS_NO_PREMIERE = STUBS_BASE.replace("showPremiere = function(){};\n", "");

function runPremiereQueueSimulation() {
  const sandbox = buildSandbox();
  vm.runInNewContext(extractGameLogic() + STUBS_NO_PREMIERE + PREMIERE_QUEUE_RUNNER, sandbox, { timeout: 20000 });
  return sandbox.__PREMIERE_QUEUE__;
}

const TUTORIAL_RUNNER = `
S = freshState();
bootstrapHonestStudio();
const tut = {
  eligibleBefore: isGuidedTutorialEligible(),
  guidedFresh: S._guidedFresh,
};
completeTutorial();
tut.eligibleAfter = isGuidedTutorialEligible();
tut.tutorialSeen = S.tutorialSeen;
tut.guidedAfter = S._guidedFresh;
__TUTORIAL__ = tut;
`;

function runTutorialSimulation() {
  const sandbox = buildSandbox();
  vm.runInNewContext(extractGameLogic() + STUBS + TUTORIAL_RUNNER, sandbox, { timeout: 20000 });
  return sandbox.__TUTORIAL__;
}

const SAVE_LOAD_RUNNER = `
S = freshState();
bootstrapHonestStudio();
hire("animator");
S.releases = 3;
S.fans = 250;
S.catalogIncome = 500;
S.questProg.greenlit = 2;
S.weekProg.taps = 7;
S.chaosMode = true;
S.franchises = { "Sakura Hit": 2 };
save();
const before = JSON.stringify(S);
S = freshState();
const loaded = load();
__SAVE_LOAD__ = {
  loaded,
  releases: S.releases,
  fans: S.fans,
  catalogIncome: S.catalogIncome,
  questGreenlit: S.questProg.greenlit,
  weekTaps: S.weekProg.taps,
  chaosMode: S.chaosMode,
  franchiseSeason: S.franchises["Sakura Hit"],
  staffAnimator: S.staff.animator,
  roundtrip: loaded && before.length > 100,
};
`;

function runSaveLoadSimulation() {
  const sandbox = buildSandbox();
  const code = extractGameLogic() + STUBS_PERSIST.replace(/^save = function\(\)\{\};\n/m, "") + SAVE_LOAD_RUNNER;
  vm.runInNewContext(code, sandbox, { timeout: 20000 });
  return sandbox.__SAVE_LOAD__;
}

const REDEEM_RUNNER = `
S = freshState();
const gems0 = S.gems;
redeem("WELCOME");
const after1 = { gems: S.gems, codes: (S.redeemedCodes || []).slice() };
redeem("WELCOME");
const after2 = { gems: S.gems, codes: (S.redeemedCodes || []).slice() };
redeem("NOTREAL");
const grant0 = S.gems;
const g1 = grantEntitlement("bundle");
const g2 = grantEntitlement("bundle");
__REDEEM__ = {
  gemsGain: after1.gems - gems0,
  codesAfterFirst: after1.codes,
  noDoubleRedeem: after2.gems === after1.gems,
  grantOnce: g1 === true && g2 === false,
  grantGems: S.gems - grant0,
};
`;

function runRedeemSimulation() {
  const sandbox = buildSandbox();
  vm.runInNewContext(extractGameLogic() + STUBS + REDEEM_RUNNER, sandbox, { timeout: 20000 });
  return sandbox.__REDEEM__;
}

const MODAL_STORM_RUNNER = `
S = freshState();
S.releases = 2;
S.studioUnlockModalSeen = true;
_studioUnlockQueued = true;
_starsUnlockQueued = true;
const storm = {};
storm.drain1 = drainUnlockModalQueue();
storm.studioCleared = !_studioUnlockQueued;
storm.starsStillQueued = _starsUnlockQueued;
S.starsUnlockModalSeen = false;
storm.drain2 = drainUnlockModalQueue();
storm.starsCleared = !_starsUnlockQueued;
__MODAL_STORM__ = storm;
`;

function runModalStormSimulation() {
  const sandbox = buildSandbox();
  vm.runInNewContext(extractGameLogic() + STUBS_BASE + MODAL_STORM_RUNNER, sandbox, { timeout: 20000 });
  return sandbox.__MODAL_STORM__;
}

const CHAOS_RUNNER = `
S = freshState();
const chaos = {
  bonusOff: chaosBonus(),
  unlock9: featureUnlocked("chaos"),
};
S.chaosMode = true;
chaos.bonusOn = chaosBonus();
S.releases = 10;
chaos.unlock10 = featureUnlocked("chaos");
__CHAOS__ = chaos;
`;

function runChaosSimulation() {
  const sandbox = buildSandbox();
  vm.runInNewContext(extractGameLogic() + STUBS + CHAOS_RUNNER, sandbox, { timeout: 20000 });
  return sandbox.__CHAOS__;
}

const RESEARCH_UNLOCK_RUNNER = `
S = freshState();
const researchGate = {
  fans119: featureUnlocked("research"),
};
S.totalFansEver = 120;
researchGate.fans120 = featureUnlocked("research");
__RESEARCH_UNLOCK__ = researchGate;
`;

function runResearchUnlockSimulation() {
  const sandbox = buildSandbox();
  vm.runInNewContext(extractGameLogic() + STUBS + RESEARCH_UNLOCK_RUNNER, sandbox, { timeout: 20000 });
  return sandbox.__RESEARCH_UNLOCK__;
}

const FRANCHISE_RUNNER = `
S = freshState();
S.yen = 50000;
S.releases = 4;
S.fans = 8000;
S.franchises = { "Sakura Hit": 1 };
const p = PROJECTS[0];
greenlight(p.id, "Action", [], { base: "Sakura Hit", genre: "Action" }, null);
const pr = S.projects[0];
const fran = {
  seq: pr ? pr.seq : 0,
  base: pr ? pr.base : null,
};
registerFranchiseHit({ title: "Sakura Hit", genre: "Action", poster: "x" }, 4);
fran.opportunity = S.franchiseOpportunity ? S.franchiseOpportunity.base : null;
fran.franchiseCount = franchiseCount();
__FRANCHISE__ = fran;
`;

function runFranchiseSimulation() {
  const sandbox = buildSandbox();
  vm.runInNewContext(extractGameLogic() + STUBS_PERSIST + FRANCHISE_RUNNER, sandbox, { timeout: 20000 });
  return sandbox.__FRANCHISE__;
}

const OFFLINE_RUNNER = `
S = freshState();
bootstrapHonestStudio();
hire("animator");
hire("writer");
hire("director");
S.yen = 200000;
const p = PROJECTS[0];
greenlight(p.id, "Action", [], null);
const pr = S.projects[0];
const progress0 = pr.progress;
const off = simulateOffline(120);
__OFFLINE__ = {
  progressGain: pr.progress - progress0,
  yen: off.yen,
  releases: off.releases,
  progressShows: off.progressShows,
};
S.catalogIncome = 2000;
const royalty = simulateOffline(60);
__OFFLINE__.royaltyYen = royalty.royaltyYen;
__OFFLINE__.royaltyTotal = royalty.yen;
`;

function runOfflineSimulation() {
  const sandbox = buildSandbox();
  vm.runInNewContext(extractGameLogic() + STUBS + OFFLINE_RUNNER, sandbox, { timeout: 20000 });
  return sandbox.__OFFLINE__;
}

const LATE_GAME_RUNNER = `
S = freshState();
S.releases = 10;
S.fans = 50000;
S.totalFansEver = 120000;
S.catalogIncome = 5000;
S.slots = 2;
S.staff = { animator: 10, writer: 8, director: 6, voice: 4, producer: 3 };
const late = {
  chaos: featureUnlocked("chaos"),
  research: featureUnlocked("research"),
  market: featureUnlocked("market"),
  stars: featureUnlocked("stars"),
  studio: featureUnlocked("studio"),
  ppt: powerPerTick(),
  expandCost: expandCost(),
};
__LATE_GAME__ = late;
`;

function runLateGameSimulation() {
  const sandbox = buildSandbox();
  vm.runInNewContext(extractGameLogic() + STUBS + LATE_GAME_RUNNER, sandbox, { timeout: 20000 });
  return sandbox.__LATE_GAME__;
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

function assertRivalGoal(rival) {
  assert(rival.goal > rival.start, "rival goal repaired above start value", `goal=${rival.goal} start=${rival.start}`);
  assert(rival.claimable === true, "rival not instantly claimable after goal repair");
}

function assertPremiereQueue(pq) {
  assert(pq.len === 1, "second premiere queued while modal open", `len=${pq.len}`);
  assert(pq.held === true, "queued premiere retains reward payload");
}

function assertTutorial(tut) {
  assert(tut.eligibleBefore === true, "guided tutorial eligible on honest bootstrap");
  assert(tut.guidedFresh === true, "honest bootstrap sets _guidedFresh");
  assert(tut.tutorialSeen === true, "completeTutorial sets tutorialSeen");
  assert(tut.guidedAfter === false, "completeTutorial clears _guidedFresh");
  assert(tut.eligibleAfter === false, "tutorial not eligible after completeTutorial");
}

function assertSaveLoad(sl) {
  assert(sl.loaded === true, "load() succeeds after save()");
  assert(sl.roundtrip === true, "save serializes non-trivial state");
  assert(sl.releases === 3, "load restores releases", `got ${sl.releases}`);
  assert(sl.fans === 250, "load restores fans", `got ${sl.fans}`);
  assert(sl.catalogIncome === 500, "load restores catalogIncome", `got ${sl.catalogIncome}`);
  assert(sl.questGreenlit === 2, "load merges questProg.greenlit", `got ${sl.questGreenlit}`);
  assert(sl.weekTaps === 7, "load merges weekProg.taps", `got ${sl.weekTaps}`);
  assert(sl.chaosMode === true, "load restores chaosMode");
  assert(sl.franchiseSeason === 2, "load restores franchises", `got ${sl.franchiseSeason}`);
  assert(sl.staffAnimator === 1, "load restores staff", `got ${sl.staffAnimator}`);
}

function assertRedeem(r) {
  assert(r.gemsGain === 25, "redeem WELCOME grants 25 gems", `got +${r.gemsGain}`);
  assert(r.codesAfterFirst.includes("WELCOME"), "redeem records code in redeemedCodes");
  assert(r.noDoubleRedeem === true, "redeem rejects duplicate code");
  assert(r.grantOnce === true, "grantEntitlement bundle idempotent");
  assert(r.grantGems === 250, "bundle grants 200 gems + first-purchase bonus once", `got ${r.grantGems}`);
}

function assertModalStorm(storm) {
  assert(storm.drain1 === true, "modal storm drain processes studio queue slot");
  assert(storm.studioCleared === true, "seen studio modal clears studio queue flag");
  assert(storm.starsStillQueued === true, "stars queue survives studio skip");
  assert(storm.drain2 === true, "second drain processes stars queue");
  assert(storm.starsCleared === true, "stars queue cleared after drain");
}

function assertChaos(chaos) {
  assert(chaos.bonusOff === 1, "chaosBonus off is 1×");
  assert(chaos.bonusOn === 1.5, "chaosBonus on is 1.5×");
  assert(chaos.unlock9 === false, "chaos locked at 9 releases");
  assert(chaos.unlock10 === true, "chaos unlocked at 10 releases");
}

function assertResearchUnlock(research) {
  assert(research.fans119 === false, "research locked at 119 totalFansEver");
  assert(research.fans120 === true, "research unlocked at 120 totalFansEver");
}

function assertFranchise(fran) {
  assert(fran.seq === 2, "sequel greenlight sets seq from franchise table", `seq=${fran.seq}`);
  assert(fran.base === "Sakura Hit", "sequel greenlight keeps franchise base");
  assert(fran.opportunity === "Sakura Hit", "registerFranchiseHit sets opportunity");
  assert(fran.franchiseCount >= 1, "franchise registry non-empty");
}

function assertOffline(off) {
  assert(off.progressGain > 0 || off.releases > 0, "simulateOffline advances production", `gain=${off.progressGain}`);
  assert(off.royaltyYen > 0, "simulateOffline accrues catalog royalties", `royalty=${off.royaltyYen}`);
  assert(off.royaltyTotal >= off.royaltyYen, "offline yen includes royalties");
}

function assertLateGame(late) {
  assert(late.studio === true, "late-game studio unlocked");
  assert(late.stars === true, "late-game stars unlocked");
  assert(late.market === true, "late-game market unlocked");
  assert(late.research === true, "late-game research unlocked");
  assert(late.chaos === true, "late-game chaos unlocked");
  assert(late.ppt > 0, "late-game powerPerTick positive", `ppt=${late.ppt}`);
  assert(late.expandCost > 0, "late-game expand cost available for slot 2");
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
    "redeemedCodes: []",
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

console.log("\nTutorial complete + eligibility:\n");
try {
  const tut = runTutorialSimulation();
  assertTutorial(tut);
} catch (e) {
  fail("vm tutorial sim", e.message || String(e));
}

console.log("\nSave/load roundtrip (questProg, weekProg, chaos, franchises):\n");
try {
  const sl = runSaveLoadSimulation();
  assertSaveLoad(sl);
} catch (e) {
  fail("vm save-load sim", e.message || String(e));
}

console.log("\nRedeem code + grantEntitlement idempotency:\n");
try {
  const r = runRedeemSimulation();
  assertRedeem(r);
} catch (e) {
  fail("vm redeem sim", e.message || String(e));
}

console.log("\nModal storm queue (seen studio → drain stars):\n");
try {
  const storm = runModalStormSimulation();
  assertModalStorm(storm);
} catch (e) {
  fail("vm modal-storm sim", e.message || String(e));
}

console.log("\nChaos mode bonus + unlock @ 10 releases:\n");
try {
  const chaos = runChaosSimulation();
  assertChaos(chaos);
} catch (e) {
  fail("vm chaos sim", e.message || String(e));
}

console.log("\nResearch unlock @ 120 totalFansEver:\n");
try {
  const research = runResearchUnlockSimulation();
  assertResearchUnlock(research);
} catch (e) {
  fail("vm research-unlock sim", e.message || String(e));
}

console.log("\nFranchise sequel greenlight + opportunity:\n");
try {
  const fran = runFranchiseSimulation();
  assertFranchise(fran);
} catch (e) {
  fail("vm franchise sim", e.message || String(e));
}

console.log("\nOffline simulateOffline (production + royalties):\n");
try {
  const off = runOfflineSimulation();
  assertOffline(off);
} catch (e) {
  fail("vm offline sim", e.message || String(e));
}

console.log("\nLate-game unlock matrix + power:\n");
try {
  const late = runLateGameSimulation();
  assertLateGame(late);
} catch (e) {
  fail("vm late-game sim", e.message || String(e));
}

console.log("\nRival goal repair (corrupt save):\n");
try {
  const rival = runRivalGoalSimulation();
  assertRivalGoal(rival);
} catch (e) {
  fail("vm rival-goal sim", e.message || String(e));
}

console.log("\nPremiere queue while modal open:\n");
try {
  const pq = runPremiereQueueSimulation();
  assertPremiereQueue(pq);
} catch (e) {
  fail("vm premiere-queue sim", e.message || String(e));
}

console.log("\nStatic save schema + unlock order:\n");
staticSaveSchemaAudit();

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);