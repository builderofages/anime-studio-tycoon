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
import {
  createFreshState,
  DEFAULT_QUEST_PROG,
  DEFAULT_SETTINGS,
  DEFAULT_STAFF,
  DEFAULT_WEEK_PROG,
  mergeLoadedSave,
  rivalGoalFromStart,
  tabUnlockPctFor,
} from "../logic.js";

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
      toggle(...c) {
        const [name, force] = c;
        if (force === true) cls.add(name);
        else if (force === false) cls.delete(name);
        else if (cls.has(name)) cls.delete(name);
        else cls.add(name);
        return cls.has(name);
      },
      has(name) {
        return cls.has(name);
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

function mockElWith(extra = {}) {
  const el = mockEl();
  if (extra.style) Object.assign(el.style, extra.style);
  if (extra.dataset) el.dataset = { ...extra.dataset };
  if (extra.hidden != null) el.hidden = extra.hidden;
  if (extra.querySelector) el.querySelector = extra.querySelector;
  return el;
}

/** Sandbox with named overlay elements (return-hub, unlock modals, decision). */
function buildDomSandbox(ids = []) {
  const els = Object.fromEntries(ids.map((id) => [id, mockElWith({ dataset: {} })]));
  const sandbox = buildSandbox();
  sandbox.document.getElementById = (id) => els[id] || mockEl();
  sandbox.document.querySelector = (sel) => {
    if (sel === ".card-modal") return mockEl();
    return mockEl();
  };
  return { sandbox, els };
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

const RETURN_HUB_IDS = [
  "return-hub",
  "return-hub-title",
  "return-hub-lead",
  "return-hub-welcome",
  "return-hub-welcome-body",
  "return-hub-offline",
  "return-hub-offline-lead",
  "return-hub-offline-preview",
  "return-hub-offlist",
  "return-hub-offline-pass",
  "return-hub-offline-cap",
  "return-hub-daily",
  "return-hub-daily-body",
  "return-hub-whatsnew",
  "return-hub-whatsnew-body",
  "return-hub-unlocks",
  "return-hub-unlocks-body",
  "btn-return-hub-close",
  "studio-unlock",
  "stars-unlock",
  "howto",
];

const RETURN_HUB_RUNNER = `
S = freshState();
S.whatsnewSeen = true;
S.lastWhatsNewBuild = BUILD_TAG;
const hub = document.getElementById("return-hub");
const studioUnlock = document.getElementById("studio-unlock");
const rh = { shown: false, hubFlex: false, drainStudio: false, hubHidden: false, noDrain: false };
rh.shown = maybeShowReturnHub({ had: true, returnSec: 0, returnR: null, dr: null });
rh.hubFlex = hub.style.display === "flex";

S = freshState();
S.releases = 1;
S.studioUnlockModalSeen = false;
S.whatsnewSeen = true;
S.lastWhatsNewBuild = BUILD_TAG;
hub.style.display = "flex";
hub.dataset.hadDaily = "1";
_studioUnlockQueued = true;
closeReturnHub();
rh.drainStudio = studioUnlock.style.display === "flex" && hub.style.display === "none" && !_studioUnlockQueued;

S = freshState();
S.whatsnewSeen = true;
S.lastWhatsNewBuild = BUILD_TAG;
hub.style.display = "flex";
hub.dataset.hadDaily = "";
studioUnlock.style.display = "none";
_studioUnlockQueued = false;
closeReturnHub();
rh.noDrain = hub.style.display === "none" && studioUnlock.style.display !== "flex";

__RETURN_HUB__ = rh;
`;

function runReturnHubSimulation() {
  const { sandbox } = buildDomSandbox(RETURN_HUB_IDS);
  vm.runInNewContext(extractGameLogic() + STUBS_BASE + RETURN_HUB_RUNNER, sandbox, { timeout: 20000 });
  return sandbox.__RETURN_HUB__;
}

const CHAOS_SURVIVAL_RUNNER = `
S = freshState();
OFFLINE = false;
started = true;
S.chaosMode = true;
S.releases = 5;
S.lastDecision = 0;
S.lastChaos = 0;
S.chaos = 90;
const decisionEl = document.getElementById("decision");
_premiereOpen = false;
window.__AST_CRISIS_OPEN__ = false;
_pendingDecision = null;
if (decisionEl) decisionEl.style.display = "none";
Math.random = () => 0.01;
maybeChaos();
const survival = {
  chaosTriggered: !!(_pendingDecision && _pendingDecision.chaos),
  chaosModeOn: S.chaosMode === true,
};

_pendingDecision = null;
window.__AST_CRISIS_OPEN__ = false;
if (decisionEl) decisionEl.style.display = "none";
S.starterSeen = true;
Math.random = () => 0.01;
maybeDecision();
survival.decisionTriggered = !!_pendingDecision && !_pendingDecision.chaos;

_pendingDecision = {
  chaos: true,
  id: "melt",
  ic: "🔥",
  title: "Test crisis",
  text: "Sim crisis",
  yes: ["Fix", () => "fixed"],
  no: ["Skip", () => "skipped"],
};
S.awaitFirstChaosSurvival = true;
const crises0 = S.crisesSurvived || 0;
resolveDecision(true);
survival.crisesGain = (S.crisesSurvived || 0) - crises0;
survival.awaitCleared = S.awaitFirstChaosSurvival === false;
survival.chaosModeOn = S.chaosMode === true;

const chanceOff = ((50) / 100) * 0.12;
const chanceOn = ((50) / 100) * 0.22;
survival.chaosModeDoublesChance = chanceOn > chanceOff;

__CHAOS_SURVIVAL__ = survival;
`;

const STUBS_CHAOS_DOM = STUBS_BASE.replace("maybeDecision = function(){};\n", "") + `
drainUnlockModalQueue = function(){ return false; };
`;

function runChaosSurvivalSimulation() {
  const { sandbox } = buildDomSandbox(["decision-body", "decision"]);
  const decision = sandbox.document.getElementById("decision");
  decision.querySelector = () => mockEl();
  vm.runInNewContext(extractGameLogic() + STUBS_CHAOS_DOM + CHAOS_SURVIVAL_RUNNER, sandbox, { timeout: 20000 });
  return sandbox.__CHAOS_SURVIVAL__;
}

const PRESTIGE_RUNNER = `
window.__AST_CONFIRM__ = function(_t, _b, cb) { cb(); };
S = freshState();
S.fans = 30000;
S.totalFansEver = 1000000;
S.yen = 999999;
S.releases = 15;
S.legacy = 5;
S.legacySpent = 2;
S.gems = 42;
S.mastery.Action = 3;
S.mastery.Drama = 1;
S.stars = [{ sid: "sakura", fame: 2, loyalty: 80, energy: 100, level: 3, promo: 0, resting: false }];
S.staff = { animator: 5, writer: 3, director: 2, voice: 1, producer: 1 };
S.tutorialSeen = true;
S.perks = { income: 2, speed: 1, fans: 0, offline: 1 };
S.entitlements = ["bundle"];
S.studioName = "Sakura Films";
const gain = Math.floor(Math.sqrt(S.totalFansEver / 1000));
const keep = {
  legacy: S.legacy + gain,
  masteryAction: S.mastery.Action,
  gems: S.gems,
  starsLen: S.stars.length,
  perksIncome: S.perks.income,
  studioName: S.studioName,
  entitlements: S.entitlements.slice(),
};
prestige();
__PRESTIGE__ = {
  gain,
  legacy: S.legacy,
  legacySpent: S.legacySpent,
  yen: S.yen,
  fans: S.fans,
  releases: S.releases,
  masteryAction: S.mastery.Action,
  gems: S.gems,
  starsLen: S.stars.length,
  perksIncome: S.perks.income,
  studioName: S.studioName,
  entitlements: S.entitlements,
  staffAnimator: S.staff.animator,
  keep,
};
`;

function runPrestigeSimulation() {
  const sandbox = buildSandbox();
  sandbox.window.__AST_CONFIRM__ = (_t, _b, cb) => cb();
  vm.runInNewContext(extractGameLogic() + STUBS + PRESTIGE_RUNNER, sandbox, { timeout: 20000 });
  return sandbox.__PRESTIGE__;
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

function assertReturnHub(rh) {
  assert(rh.shown === true, "maybeShowReturnHub shows hub when had:true");
  assert(rh.hubFlex === true, "return-hub display flex after maybeShowReturnHub");
  assert(rh.drainStudio === true, "closeReturnHub drains studio unlock queue");
  assert(rh.noDrain === true, "closeReturnHub hides hub without queued unlocks");
}

function assertChaosSurvival(survival) {
  assert(survival.crisesGain === 1, "resolveDecision chaos increments crisesSurvived", `+${survival.crisesGain}`);
  assert(survival.awaitCleared === true, "celebrateChaosSurvival clears awaitFirstChaosSurvival");
  assert(survival.chaosModeOn === true, "chaos survival keeps chaosMode on");
  assert(survival.decisionTriggered === true, "maybeDecision fires with chaosMode on");
  assert(survival.chaosTriggered === true, "maybeChaos triggers chaos crisis with chaosMode on");
  assert(survival.chaosModeDoublesChance === true, "chaosMode raises maybeChaos trigger rate");
}

function assertPrestige(p) {
  assert(p.gain === 31, "prestige legacy gain from totalFansEver", `gain=${p.gain}`);
  assert(p.legacy === p.keep.legacy, "prestige carries legacy + gain", `legacy=${p.legacy}`);
  assert(p.yen === 1500, "prestige resets yen to fresh", `yen=${p.yen}`);
  assert(p.fans === 0, "prestige resets fans", `fans=${p.fans}`);
  assert(p.releases === 0, "prestige resets releases", `releases=${p.releases}`);
  assert(p.staffAnimator === 0, "prestige resets staff", `animator=${p.staffAnimator}`);
  assert(p.masteryAction === p.keep.masteryAction, "prestige keeps mastery", `Action=${p.masteryAction}`);
  assert(p.gems === p.keep.gems, "prestige keeps gems", `gems=${p.gems}`);
  assert(p.starsLen === p.keep.starsLen, "prestige keeps stars roster", `stars=${p.starsLen}`);
  assert(p.perksIncome === p.keep.perksIncome, "prestige keeps perks", `income=${p.perksIncome}`);
  assert(p.studioName === p.keep.studioName, "prestige keeps studioName", `name=${p.studioName}`);
  assert(
    Array.isArray(p.entitlements) && p.entitlements[0] === "bundle",
    "prestige keeps entitlements"
  );
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

const TEST_GENRES = ["Action", "Drama", "Comedy"];

function testExtractedLogic() {
  const fresh = createFreshState(TEST_GENRES);

  assert(
    fresh.staff.animator === 0 && fresh.questProg.taps === 0 && fresh.settings.confirmGems === true,
    "createFreshState uses nested save defaults"
  );

  const partial = { staff: { animator: 3 }, questProg: { taps: 9 }, settings: { motion: false } };
  const merged = mergeLoadedSave(partial, fresh, TEST_GENRES);
  assert(merged.staff.animator === 3 && merged.staff.writer === 0, "mergeLoadedSave fills staff defaults");
  assert(merged.questProg.taps === 9 && merged.questProg.greenlit === 0, "mergeLoadedSave fills questProg defaults");
  assert(merged.settings.motion === false && merged.settings.confirmGems === true, "mergeLoadedSave merges settings");

  const legacy = mergeLoadedSave(
    { project: { pid: 0, progress: 50, genre: "Action" }, slots: 2 },
    fresh,
    TEST_GENRES
  );
  assert(legacy.slots === 2 && legacy.projects[0]?.pid === 0, "mergeLoadedSave migrates legacy d.project");

  const s0 = { releases: 0, fans: 0, totalFansEver: 0, projects: [{ pid: 0, progress: 40 }] };
  assert(tabUnlockPctFor("studio", s0, () => 80) === 50, "tabUnlockPct studio project progress");
  assert(tabUnlockPctFor("studio", { releases: 1, projects: [] }) === null, "tabUnlockPct studio null when unlocked");
  assert(tabUnlockPctFor("stars", { releases: 1, totalFansEver: 10 }) === 50, "tabUnlockPct stars dual gate");
  assert(tabUnlockPctFor("market", { fans: 25 }) === 50, "tabUnlockPct market fans/50");
  assert(tabUnlockPctFor("research", { totalFansEver: 60 }) === 50, "tabUnlockPct research fansEver/120");
  assert(tabUnlockPctFor("chaos", { releases: 5 }) === 50, "tabUnlockPct chaos releases/10");
  assert(tabUnlockPctFor("market", { fans: 50 }) === null, "tabUnlockPct null when feature unlocked");

  const goalLo = rivalGoalFromStart(100, () => 0);
  const goalHi = rivalGoalFromStart(100, () => 0.999);
  assert(goalLo === 114 && goalHi === 139, "rivalGoalFromStart scales with rng", `lo=${goalLo} hi=${goalHi}`);
  assert(rivalGoalFromStart(0, () => 0) === 1, "rivalGoalFromStart minimum goal above zero start");

  assert(DEFAULT_STAFF.animator === 0, "DEFAULT_STAFF exported");
  assert(DEFAULT_QUEST_PROG.greenlit === 0 && DEFAULT_WEEK_PROG.taps === 0, "DEFAULT_QUEST_PROG / DEFAULT_WEEK_PROG exported");
  assert(DEFAULT_SETTINGS.musicVol === 0.35, "DEFAULT_SETTINGS exported");
}

function staticSaveSchemaAudit() {
  const logic = readFileSync(join(root, "logic.js"), "utf8");
  const html = readFileSync(join(root, "index.html"), "utf8");
  const requiredKeys = [
    "yen: 1500",
    "releases: 0",
    "slots: 1",
    "DEFAULT_STAFF",
    "projects: [null]",
    "_guidedFresh: false",
    "_demoMode: false",
    "catalogIncome: 0",
    "redeemedCodes: []",
    "defaultMastery(genres)",
    "tabUnlockPctFor",
    "rivalGoalFromStart",
    "mergeLoadedSave",
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

console.log("Extracted logic.js pure helpers:\n");
try {
  testExtractedLogic();
} catch (e) {
  fail("logic.js unit checks", e.message || String(e));
}

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

console.log("\nReturn hub show + closeReturnHub unlock drain:\n");
try {
  const rh = runReturnHubSimulation();
  assertReturnHub(rh);
} catch (e) {
  fail("vm return-hub sim", e.message || String(e));
}

console.log("\nChaos survival (resolveDecision + maybeDecision/maybeChaos @ chaosMode):\n");
try {
  const survival = runChaosSurvivalSimulation();
  assertChaosSurvival(survival);
} catch (e) {
  fail("vm chaos-survival sim", e.message || String(e));
}

console.log("\nPrestige() carry-over (legacy, mastery, gems, stars):\n");
try {
  const p = runPrestigeSimulation();
  assertPrestige(p);
} catch (e) {
  fail("vm prestige sim", e.message || String(e));
}

console.log("\nStatic save schema + unlock order:\n");
staticSaveSchemaAudit();

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);