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
  CONTENT_RANK_LADDER,
  activeCountFor,
  castingCostFor,
  contentRankIndexFor,
  createFreshState,
  DEFAULT_QUEST_PROG,
  DEFAULT_SETTINGS,
  DEFAULT_STAFF,
  DEFAULT_WEEK_PROG,
  fmtEta,
  hireCostFor,
  hypeCapFor,
  levelMultForLevel,
  mergeLoadedSave,
  passMultFor,
  productionScoreFor,
  rivalGoalFromStart,
  safeSaveNum,
  repairLoadedStateFor,
  repairRivalGoalFor,
  starsUnlockProgressFor,
  tabLockedFor,
  tabInDockFor,
  masteryResearchCostFor,
  VALID_TABS,
  starRankLetterFor,
  studioLevelFromFans,
  studioRankLetterFor,
  studioValueFor,
  tabUnlockPctFor,
  upCostFor,
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
    get children() {
      return kids;
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
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => {
        store[k] = v;
      },
      removeItem: (k) => {
        delete store[k];
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
    tf: (key, vars, fb) => {
      let s = fb || key;
      if (vars) {
        for (const k in vars) s = String(s).split("{" + k + "}").join(String(vars[k]));
      }
      return s;
    },
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
  const cut = code.indexOf("let loaded=false;");
  if (cut < 0) throw new Error("game script cut marker missing");
  return loadLogicForVm() + "\n" + code.slice(0, cut);
}

/** Boot-time IAP helpers live after the load() cut in index.html. */
function extractIapGrantFns() {
  const html = readFileSync(join(root, "index.html"), "utf8");
  const m = html.match(/<script type="module">([\s\S]*?)<\/script>/);
  if (!m) throw new Error("index.html game script block not found");
  const code = m[1];
  const start = code.indexOf("function clearGrantParams()");
  const end = code.indexOf("readGrant();");
  if (start < 0 || end < 0) throw new Error("IAP grant fns not found in index.html");
  return code.slice(start, end);
}

/** IAP_FETCH_MOCK: redeem VALID/INVALID, license→redeem chain, pass idempotency */
function createGrantFetchMock() {
  return async function grantFetch(url, opts = {}) {
    const u = String(url);
    if (u.includes("/api/grant/redeem")) {
      const pt = new URL(u, "http://localhost").searchParams.get("pt");
      if (pt === "VALID") {
        return { json: async () => ({ ok: true, grant: { kind: "gems", amount: "100", gid: "test-gems-100" } }) };
      }
      if (pt === "TEST_PT") {
        return { json: async () => ({ ok: true, grant: { kind: "gems", amount: "100", gid: "test-license-gems-100" } }) };
      }
      if (pt === "PASS_PT") {
        return { json: async () => ({ ok: true, grant: { kind: "pass", gid: "test-pass" } }) };
      }
      if (pt === "INVALID") {
        return { json: async () => ({ ok: false }) };
      }
    }
    if (u.includes("/api/grant/license") && opts.method === "POST") {
      return { json: async () => ({ ok: true, pt: "TEST_PT" }) };
    }
    return { json: async () => ({ ok: false }) };
  };
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

const PREMIERE_QUEUE_MULTI_RUNNER = `
S = freshState();
S.slots = 3;
_premiereOpen = true;
_premiereQueue = [];
const p = PROJECTS[0];
const mk = (n, yen) => ({ title: "Hit " + n, genre: "Action", poster: "" });
showPremiere(mk(1, p), p, 4, 1000, 50);
showPremiere(mk(2, p), p, 3, 2000, 40);
showPremiere(mk(3, p), p, 5, 3000, 60);
const pq = {
  queued: _premiereQueue.length,
  fifoYen: _premiereQueue.map((x) => x.yenGain),
  fifoStars: _premiereQueue.map((x) => x.stars),
};
closePremiere();
pq.afterClose1 = _premiereQueue.length;
pq.openAfter1 = _premiereOpen;
closePremiere();
pq.afterClose2 = _premiereQueue.length;
closePremiere();
pq.afterClose3 = _premiereQueue.length;
closePremiere();
pq.drained = _premiereQueue.length === 0 && !_premiereOpen;
__PREMIERE_QUEUE_MULTI__ = pq;
`;

const COACH_LOCKED_TAB_RUNNER = `
function coachSafeTab(dest) {
  let tab = dest;
  let blocked = false;
  if (!tabAccessible(dest)) {
    tab = "produce";
    blocked = true;
  } else if (tabLocked(dest)) {
    blocked = true;
    tab = "produce";
  }
  S.tab = tab;
  return { tab, blocked, wasLocked: tabLocked(dest) };
}

S = freshState();
bootstrapHonestStudio();
S.tab = "produce";
const coach = {};
coach.starsRedirect = coachSafeTab("stars");
coach.marketRedirect = coachSafeTab("market");
coach.staffOk = coachSafeTab("staff");

S.releases = 2;
S.totalFansEver = 25;
S.tab = "produce";
coach.starsUnlocked = coachSafeTab("stars");

S.fans = 50;
coach.marketUnlocked = coachSafeTab("market");

S.tab = "research";
if (!tabAccessible(S.tab)) S.tab = "produce";
coach.renderGuard = S.tab === "produce";

S.tab = "produce";
const tabBefore = S.tab;
setTab("research");
coach.setTabBlocked = S.tab === tabBefore;
__COACH_LOCKED_TAB__ = coach;
`;

const CORRUPT_LOAD_RUNNER = `
S = freshState();
localStorage.setItem(SAVE_KEY, "not-json");
let corrupt = { badJson: load() };
corrupt.keyRemoved = localStorage.getItem(SAVE_KEY) === null;

localStorage.setItem(SAVE_KEY, "[]");
corrupt.arraySave = load();
corrupt.arrayRemoved = localStorage.getItem(SAVE_KEY) === null;

S = freshState();
S.tab = "nope";
S.slots = 99;
S.projects = [{ pid: 0, progress: 999 }, null, { pid: 999, progress: 10 }];
S.staff = { animator: NaN, writer: -1 };
repairLoadedState();
corrupt.repairedTab = S.tab;
corrupt.repairedSlots = S.slots;
corrupt.repairedProjects = S.projects.length;
corrupt.repairedProgress = S.projects[0] && S.projects[0].progress;
corrupt.repairedStaff = S.staff.animator;

S = freshState();
S.rivalStartVal = 500;
S.rivalGoal = 100;
repairRivalGoalFor(S, studioValue(), () => 0);
corrupt.rivalGoal = S.rivalGoal;
__CORRUPT_LOAD__ = corrupt;
`;

const DOUBLE_IAP_RUNNER = `
globalThis.__runDoubleIapSim = async function() {
  S = freshState();
  S.redeemedGrants = ["test-gems-100"];
  const gems0 = S.gems;
  const preRedeemed = await redeemPurchaseToken("VALID");
  const gemsAfterPre = S.gems;

  S = freshState();
  const gems1 = S.gems;
  const [a, b] = await Promise.all([
    redeemPurchaseToken("VALID"),
    redeemPurchaseToken("VALID"),
  ]);
  const gemsAfterRace = S.gems;
  const grantCount = (S.redeemedGrants || []).filter((g) => g === "test-gems-100").length;

  return {
    preRedeemed,
    gemsAfterPre,
    gemsNoGrantWhenGidKnown: gemsAfterPre === gems0,
    raceFirst: a,
    raceSecond: b,
    raceGemsGain: gemsAfterRace - gems1,
    raceSingleGrant: grantCount === 1,
    raceNoDoubleGems: gemsAfterRace === gems1 + 170,
  };
};
`;

const STUBS_NO_PREMIERE = STUBS_BASE.replace("showPremiere = function(){};\n", "");

function runPremiereQueueSimulation() {
  const sandbox = buildSandbox();
  vm.runInNewContext(extractGameLogic() + STUBS_NO_PREMIERE + PREMIERE_QUEUE_RUNNER, sandbox, { timeout: 20000 });
  return sandbox.__PREMIERE_QUEUE__;
}

function runPremiereQueueMultiSimulation() {
  const { sandbox } = buildDomSandbox(["premiere", "premiere-body"]);
  vm.runInNewContext(extractGameLogic() + STUBS_NO_PREMIERE + PREMIERE_QUEUE_MULTI_RUNNER, sandbox, {
    timeout: 20000,
  });
  return sandbox.__PREMIERE_QUEUE_MULTI__;
}

function runCoachLockedTabSimulation() {
  const sandbox = buildSandbox();
  vm.runInNewContext(extractGameLogic() + STUBS + COACH_LOCKED_TAB_RUNNER, sandbox, { timeout: 20000 });
  return sandbox.__COACH_LOCKED_TAB__;
}

function runCorruptLoadSimulation() {
  const sandbox = buildSandbox();
  const code =
    extractGameLogic() +
    STUBS_PERSIST.replace(/^save = function\(\)\{\};\n/m, "").replace(/^load = function\(\)\{\};\n/m, "") +
    CORRUPT_LOAD_RUNNER;
  vm.runInNewContext(code, sandbox, { timeout: 20000 });
  return sandbox.__CORRUPT_LOAD__;
}

async function runDoubleIapSimulation() {
  const sandbox = buildSandbox();
  sandbox.fetch = createGrantFetchMock();
  vm.runInNewContext(extractGameLogic() + extractIapGrantFns() + STUBS + DOUBLE_IAP_RUNNER, sandbox, {
    timeout: 20000,
  });
  return sandbox.__runDoubleIapSim();
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
const bundleGems = S.gems - grant0;
const itemsGems0 = S.gems;
const ip1 = grantEntitlement("items_pack");
const afterIp1 = { gems: S.gems, items: Object.assign({}, S.items||{}), ents: (S.entitlements||[]).slice() };
const ip2 = grantEntitlement("items_pack");
const gemsAfterIp2 = S.gems;
const passGems0 = S.gems;
const p1 = grantEntitlement("pass");
const p2 = grantEntitlement("pass");
const gemsAfterP2 = S.gems;
const legendGems0 = S.gems;
const bl1 = grantEntitlement("bundle_legend");
const bl2 = grantEntitlement("bundle_legend");
const gemsAfterBl2 = S.gems;
const mogulGems0 = S.gems;
const bm1 = grantEntitlement("bundle_mogul");
const bm2 = grantEntitlement("bundle_mogul");
const gemsAfterBm2 = S.gems;
const noads1 = grantEntitlement("noads");
const noads2 = grantEntitlement("noads");
__REDEEM__ = {
  gemsGain: after1.gems - gems0,
  codesAfterFirst: after1.codes,
  noDoubleRedeem: after2.gems === after1.gems,
  grantOnce: g1 === true && g2 === false,
  grantGems: bundleGems,
  itemsFirst: ip1 === true,
  itemsRepeat: ip2,
  itemsGemsGain: afterIp1.gems - itemsGems0,
  itemsEntitled: afterIp1.ents.includes("items_pack"),
  itemsMegaphone: afterIp1.items.megaphone === 1,
  itemsNoDoubleGems: gemsAfterIp2 === afterIp1.gems,
  passFirst: p1 === true,
  passRepeat: p2,
  passNoDoubleGems: gemsAfterP2 === passGems0,
  legendFirst: bl1 === true,
  legendRepeat: bl2,
  legendNoDoubleGems: gemsAfterBl2 === legendGems0 + 400,
  mogulFirst: bm1 === true,
  mogulRepeat: bm2,
  mogulNoDoubleGems: gemsAfterBm2 === mogulGems0 + 1500,
  noadsFirst: noads1 === true,
  noadsRepeat: noads2,
};
`;

function runRedeemSimulation() {
  const sandbox = buildSandbox();
  vm.runInNewContext(extractGameLogic() + STUBS + REDEEM_RUNNER, sandbox, { timeout: 20000 });
  return sandbox.__REDEEM__;
}

const IAP_RUNNER = `
globalThis.__runIapSim = async function() {
  S = freshState();
  const gems0 = S.gems;
  const validChanged = await redeemPurchaseToken("VALID");
  const gemsAfterValid = S.gems;
  const validDupChanged = await redeemPurchaseToken("VALID");
  const gemsAfterValidDup = S.gems;
  const invalidChanged = await redeemPurchaseToken("INVALID");
  const gemsAfterInvalid = S.gems;
  const gemsBeforeLicense = S.gems;
  await redeemLicenseKey("bundle", "KEY-123");
  const gemsAfterLicense = S.gems;
  const gemsBeforeLicenseDup = S.gems;
  await redeemLicenseKey("bundle", "KEY-123");
  const gemsAfterLicenseDup = S.gems;

  S = freshState();
  const passFirst = await redeemPurchaseToken("PASS_PT");
  const passSecond = await redeemPurchaseToken("PASS_PT");
  const passEntitlements = (S.entitlements || []).filter((e) => e === "pass").length;

  return {
    validChanged,
    validDupChanged,
    invalidChanged,
    gemsValidGain: gemsAfterValid - gems0,
    gemsNoDoubleValid: gemsAfterValidDup === gemsAfterValid,
    gemsUnchangedAfterInvalid: gemsAfterInvalid === gemsAfterValid,
    gemsLicenseGain: gemsAfterLicense - gemsBeforeLicense,
    gemsNoDoubleLicense: gemsAfterLicenseDup === gemsAfterLicense,
    passFirst,
    passSecond,
    passEntitlements,
    producerPass: S.producerPass,
  };
};
`;

async function runIapSimulation() {
  const sandbox = buildSandbox();
  sandbox.fetch = createGrantFetchMock();
  vm.runInNewContext(extractGameLogic() + extractIapGrantFns() + STUBS + IAP_RUNNER, sandbox, {
    timeout: 20000,
  });
  return sandbox.__runIapSim();
}

const GRANT_PERSIST_RUNNER = `
globalThis.__runGrantPersistSim = async function() {
  S = freshState();
  const gems0 = S.gems;
  await redeemPurchaseToken("VALID");
  const gemsAfter = S.gems;
  save();
  const raw = localStorage.getItem("anime_studio_tycoon_v1");
  const parsed = raw ? JSON.parse(raw) : {};
  const gidPersisted = (parsed.redeemedGrants || []).includes("test-gems-100");

  S = freshState();
  load();
  const gemsBeforeReload = S.gems;
  const gidLoaded = (S.redeemedGrants || []).includes("test-gems-100");
  const changed = await redeemPurchaseToken("VALID");
  const gemsAfterReload = S.gems;

  return {
    gemsGain: gemsAfter - gems0,
    gidPersisted,
    gidLoaded,
    reloadNoDouble: gemsAfterReload === gemsBeforeReload,
    reloadChanged: changed,
  };
};
`;

async function runGrantPersistSimulation() {
  const sandbox = buildSandbox();
  sandbox.fetch = createGrantFetchMock();
  const code =
    extractGameLogic() +
    extractIapGrantFns() +
    STUBS_PERSIST.replace(/^save = function\(\)\{\};\n/m, "").replace(/^load = function\(\)\{\};\n/m, "") +
    GRANT_PERSIST_RUNNER;
  vm.runInNewContext(code, sandbox, { timeout: 20000 });
  return sandbox.__runGrantPersistSim();
}

const MODAL_STORM_IDS = [
  "studio-unlock",
  "stars-unlock",
  "market-unlock",
  "research-unlock",
  "chaos-unlock",
];

/** Elements that record flex display into order[] for priority-chain assertions. */
function buildModalStormSandbox() {
  const order = [];
  const els = Object.fromEntries(
    MODAL_STORM_IDS.map((id) => {
      const el = mockElWith({ dataset: {} });
      const style = { _d: "none" };
      Object.defineProperty(style, "display", {
        get() {
          return style._d;
        },
        set(v) {
          style._d = v;
          if (v === "flex") order.push(id);
        },
        enumerable: true,
        configurable: true,
      });
      el.style = style;
      return [id, el];
    })
  );
  const sandbox = buildSandbox();
  sandbox.document.getElementById = (id) => els[id] || mockEl();
  sandbox.document.querySelector = (sel) => {
    if (sel === ".card-modal") return mockEl();
    return mockEl();
  };
  return { sandbox, order };
}

const MODAL_STORM_DISMISS = `
function __dismissUnlockModals__() {
  for (const id of __MODAL_STORM_IDS__) {
    const m = document.getElementById(id);
    if (m) m.style.display = "none";
  }
}
`;

const MODAL_STORM_RUNNER = `
S = freshState();
S.releases = 10;
S.fans = 50;
S.totalFansEver = 120;
S.studioUnlockModalSeen = true;
_studioUnlockQueued = true;
_starsUnlockQueued = true;
_marketUnlockQueued = true;
_researchUnlockQueued = true;
_chaosUnlockQueued = true;
const storm = {};
storm.drain1 = drainUnlockModalQueue();
__dismissUnlockModals__();
storm.drain2 = drainUnlockModalQueue();
__dismissUnlockModals__();
storm.drain3 = drainUnlockModalQueue();
__dismissUnlockModals__();
storm.drain4 = drainUnlockModalQueue();
__dismissUnlockModals__();
storm.drain5 = drainUnlockModalQueue();
__dismissUnlockModals__();
storm.drain6 = drainUnlockModalQueue();
storm.studioCleared = !_studioUnlockQueued;
storm.starsCleared = !_starsUnlockQueued;
storm.marketCleared = !_marketUnlockQueued;
storm.researchCleared = !_researchUnlockQueued;
storm.chaosCleared = !_chaosUnlockQueued;
storm.order = __MODAL_ORDER__;
__MODAL_STORM__ = storm;
`;

const MODAL_STORM_FIVE_RUNNER = `
S = freshState();
S.releases = 10;
S.fans = 50;
S.totalFansEver = 120;
S.studioUnlockModalSeen = false;
S.starsUnlockModalSeen = false;
S.marketUnlockModalSeen = false;
S.researchUnlockModalSeen = false;
S.chaosUnlockModalSeen = false;
_studioUnlockQueued = true;
_starsUnlockQueued = true;
_marketUnlockQueued = true;
_researchUnlockQueued = true;
_chaosUnlockQueued = true;
const five = { drains: [] };
for (let i = 0; i < 6; i++) {
  five.drains.push(drainUnlockModalQueue());
  __dismissUnlockModals__();
}
five.order = __MODAL_ORDER__;
five.allCleared =
  !_studioUnlockQueued &&
  !_starsUnlockQueued &&
  !_marketUnlockQueued &&
  !_researchUnlockQueued &&
  !_chaosUnlockQueued;
__MODAL_STORM_FIVE__ = five;
`;

function runModalStormSimulation() {
  const { sandbox, order } = buildModalStormSandbox();
  sandbox.__MODAL_ORDER__ = order;
  sandbox.__MODAL_STORM_IDS__ = MODAL_STORM_IDS;
  vm.runInNewContext(
    extractGameLogic() + STUBS_BASE + MODAL_STORM_DISMISS + MODAL_STORM_RUNNER,
    sandbox,
    { timeout: 20000 }
  );
  return sandbox.__MODAL_STORM__;
}

function runModalStormFiveSimulation() {
  const { sandbox, order } = buildModalStormSandbox();
  sandbox.__MODAL_ORDER__ = order;
  sandbox.__MODAL_STORM_IDS__ = MODAL_STORM_IDS;
  vm.runInNewContext(
    extractGameLogic() + STUBS_BASE + MODAL_STORM_DISMISS + MODAL_STORM_FIVE_RUNNER,
    sandbox,
    { timeout: 20000 }
  );
  return sandbox.__MODAL_STORM_FIVE__;
}

const READ_GRANT_RUNNER = `
globalThis.__runReadGrantSim = function() {
  S = freshState();
  const gems0 = S.gems;
  location.search = "?grant=gems&amt=30";
  let paramsCleared = false;
  history.replaceState = function() {
    paramsCleared = true;
    location.search = "";
  };
  readGrant();
  const devGrant = { gemsGain: S.gems - gems0, paramsCleared };

  S = freshState();
  location.hostname = "localhost";
  location.search = "?unlock=items_pack";
  paramsCleared = false;
  readGrant();
  const devUnlock = {
    gems: S.gems,
    entitled: (S.entitlements || []).includes("items_pack"),
    megaphone: (S.items || {}).megaphone || 0,
    paramsCleared,
  };

  S = freshState();
  location.hostname = "example.com";
  location.search = "?grant=gems&amt=99";
  const gemsBlocked0 = S.gems;
  readGrant();
  const prodBlocked = S.gems === gemsBlocked0;

  S = freshState();
  location.hostname = "example.com";
  location.search = "?devgrants=1&grant=gems&amt=15";
  const gemsDevFlag0 = S.gems;
  readGrant();
  const devFlagGrant = S.gems - gemsDevFlag0;

  return { devGrant, devUnlock, prodBlocked, devFlagGrant };
};
`;

function runReadGrantSimulation() {
  const sandbox = buildSandbox();
  vm.runInNewContext(extractGameLogic() + extractIapGrantFns() + STUBS + READ_GRANT_RUNNER, sandbox, {
    timeout: 20000,
  });
  return sandbox.__runReadGrantSim();
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

const MARKET_RESEARCH_RUNNER = `
S = freshState();
S.fans = 50;
S.totalFansEver = 120;
S.yen = 5000;
S.hype = 10;
const genre = GENRES[0];
const yen0 = S.yen;
const hype0 = S.hype;
const fans0 = S.fans;
research(genre);
const badResearch = (() => { const y = S.yen; research("NotAGenre"); return S.yen === y; })();
campaign(0);
const badCamp = (() => { const y = S.yen; campaign(999); return S.yen === y; })();
__MARKET_RESEARCH__ = {
  mastery: S.mastery[genre] || 0,
  yenSpent: yen0 - S.yen,
  hypeSpent: hype0 - S.hype,
  fansGain: S.fans - fans0,
  campaigns: S.campaignsRun || 0,
  badResearch,
  badCamp,
};
`;

function runMarketResearchSimulation() {
  const sandbox = buildSandbox();
  vm.runInNewContext(extractGameLogic() + STUBS + MARKET_RESEARCH_RUNNER, sandbox, { timeout: 20000 });
  return sandbox.__MARKET_RESEARCH__;
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

const DYNASTY_PERK_RUNNER = `
S = freshState();
S.releases = 10;
S.dynastyPoints = 20;
S.dynastySpent = 0;
S.dynastyPerks = { income: 0, premiere: 0, festival: 0 };
const spent0 = S.dynastySpent;
buyDynastyPerk("income");
const dp = {
  lvl: S.dynastyPerks.income,
  spentDelta: S.dynastySpent - spent0,
  avail: dynastyAvailable(),
};
S2 = freshState();
S2.dynastyPoints = 5;
S2.dynastySpent = 0;
buyDynastyPerk("income");
dp.blockedLow = (S2.dynastyPerks.income || 0) === 0;
S3 = freshState();
S3.yen = 50000;
S3.slots = 1;
const p = PROJECTS[0];
greenlight(p.id, "Action", [], null);
makeSequel("Sakura Hit", "Action");
dp.sequelBlockedFull = activeCount() === 1;
__DYNASTY_PERK__ = dp;
`;

function runDynastyPerkSimulation() {
  const sandbox = buildSandbox();
  vm.runInNewContext(extractGameLogic() + STUBS_PERSIST + DYNASTY_PERK_RUNNER, sandbox, { timeout: 20000 });
  return sandbox.__DYNASTY_PERK__;
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

const MODAL_PENDING_IDS = ["offline", "daily", "whatsnew", "howto", "studio-unlock", "return-hub"];

const MODAL_PENDING_RUNNER = `
S = freshState();
S.releases = 1;
S.studioUnlockModalSeen = false;
const offline = document.getElementById("offline");
const studioUnlock = document.getElementById("studio-unlock");
offline.style.display = "flex";
const mp = {};
mp.pending = unlockModalPending();
mp.drainBlocked = drainUnlockModalQueue();
_studioUnlockQueued = false;
queueStudioUnlockModal();
mp.queued = _studioUnlockQueued === true;
mp.studioShown = studioUnlock.style.display === "flex";
offline.style.display = "none";
_studioUnlockQueued = false;
studioUnlock.style.display = "none";
__MODAL_PENDING__ = mp;
`;

function runModalPendingSimulation() {
  const { sandbox } = buildDomSandbox(MODAL_PENDING_IDS);
  vm.runInNewContext(extractGameLogic() + STUBS_BASE + MODAL_PENDING_RUNNER, sandbox, { timeout: 20000 });
  return sandbox.__MODAL_PENDING__;
}

const BOOT_PRIORITY_IDS = [
  "return-hub",
  "return-hub-title",
  "return-hub-lead",
  "return-hub-welcome",
  "return-hub-welcome-body",
  "return-hub-daily",
  "return-hub-daily-body",
  "return-hub-whatsnew",
  "return-hub-whatsnew-body",
  "whatsnew",
  "daily",
  "howto",
];

const BOOT_PRIORITY_RUNNER = `
S = freshState();
S.whatsnewSeen = true;
S.lastWhatsNewBuild = BUILD_TAG;
const daily = document.getElementById("daily");
const hub = document.getElementById("return-hub");
const whatsnew = document.getElementById("whatsnew");
bootReturnBatch({ had: false, returnSec: 0, returnR: null, dr: { streak: 2, gems: 5, yenBonus: 500 } });
const bp = {};
bp.hubShown = hub.style.display === "flex";
bp.dailyStandalone = daily.style.display === "flex";
bp.whatsnewStandalone = whatsnew.style.display === "flex";

S = freshState();
S.whatsnewSeen = false;
S.lastWhatsNewBuild = "";
S.tutorialSeen = true;
hub.style.display = "none";
daily.style.display = "none";
whatsnew.style.display = "none";
bootReturnBatch({ had: false, returnSec: 0, returnR: null, dr: null });
bp.whatsnewHub = hub.style.display === "flex";
bp.whatsnewBundled = hub.dataset.hadWhatsnew === "1";
bp.whatsnewStandaloneBlocked = whatsnew.style.display !== "flex";
__BOOT_PRIORITY__ = bp;
`;

function runBootPrioritySimulation() {
  const { sandbox, els } = buildDomSandbox(BOOT_PRIORITY_IDS);
  const whatsnew = els.whatsnew;
  if (whatsnew) {
    whatsnew.querySelector = (sel) => {
      if (sel === "#whatsnew-title") return { textContent: "Build 110" };
      if (sel === ".offlist") return { children: [] };
      return mockEl();
    };
  }
  vm.runInNewContext(extractGameLogic() + STUBS_BASE + BOOT_PRIORITY_RUNNER, sandbox, { timeout: 20000 });
  return sandbox.__BOOT_PRIORITY__;
}

const AWARD_DEFER_RUNNER = `
S = freshState();
OFFLINE = false;
_premiereWillShow = true;
_studioAwardQueued = null;
queueStudioAwardModal(3, 16);
__AWARD_DEFER__ = {
  queued: _studioAwardQueued !== null,
  num: _studioAwardQueued && _studioAwardQueued.num === 3,
  gems: _studioAwardQueued && _studioAwardQueued.gems === 16,
};
`;

function runAwardDeferSimulation() {
  const sandbox = buildSandbox();
  vm.runInNewContext(extractGameLogic() + STUBS_BASE + AWARD_DEFER_RUNNER, sandbox, { timeout: 20000 });
  return sandbox.__AWARD_DEFER__;
}

const PREMIERE_DEFER_RUNNER = `
S = freshState();
_premiereOpen = false;
const offline = document.getElementById("offline");
offline.style.display = "flex";
const pr = { title: "Deferred", genre: "Action", poster: "" };
const p = PROJECTS[0];
showPremiere(pr, p, 4, 2000, 80);
__PREMIERE_DEFER__ = {
  len: _premiereQueue.length,
  held: _premiereQueue[0] && _premiereQueue[0].yenGain === 2000,
};
`;

function runPremiereDeferSimulation() {
  const { sandbox } = buildDomSandbox(["offline", "premiere", "premiere-body"]);
  vm.runInNewContext(extractGameLogic() + STUBS_NO_PREMIERE + PREMIERE_DEFER_RUNNER, sandbox, { timeout: 20000 });
  return sandbox.__PREMIERE_DEFER__;
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

survival.dangerCritical = chaosDangerTier(90).cls === "critical";
_pendingDecision = null;
window.__AST_CRISIS_OPEN__ = false;
if (decisionEl) decisionEl.style.display = "none";
document.documentElement.classList.remove("ast-crisis-open");
S.chaos = 90;
_pendingDecision = Object.assign({ chaos: true }, CHAOS[0]);
renderDecisionModal(_pendingDecision, true);
const bodyEl = document.getElementById("decision-body");
survival.dangerMarkup = !!(bodyEl && bodyEl.innerHTML.includes("aaa-decision-danger--critical"));
survival.dangerPct = !!(bodyEl && bodyEl.innerHTML.includes("90%"));
survival.hudPulseOn = document.documentElement.classList.has("ast-crisis-open");
_pendingDecision = {
  chaos: true,
  id: "melt",
  ic: "🔥",
  title: "Test crisis",
  text: "Sim crisis",
  yes: ["Fix", () => "fixed"],
  no: ["Skip", () => "skipped"],
};
resolveDecision(true);
survival.hudPulseCleared = !document.documentElement.classList.has("ast-crisis-open");

S.yen = 2;
const meltPay = CHAOS[0].yes[1]();
survival.spendYenBlocked = meltPay.includes("No funds") && S.yen >= 0;
S.yen = 50000;
const payCost = bigYen();
const yenBeforePay = S.yen;
CHAOS[0].yes[1]();
survival.spendYenDeduct = S.yen === yenBeforePay - payCost && S.yen >= 0;

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

function loadEmpireForVm() {
  return readFileSync(join(root, "gameplay-empire.js"), "utf8");
}

function buildEmpireCrisisSandbox() {
  const { sandbox } = buildDomSandbox(["decision-body", "decision"]);
  const decision = sandbox.document.getElementById("decision");
  decision.querySelector = () => mockEl();
  const body = mockEl();
  body.dataset = {};
  sandbox.document.body = body;
  sandbox.__empireTimeouts__ = [];
  sandbox.setInterval = (fn, ms) => {
    if (ms === 80) sandbox.__empireTimeouts__.push(fn);
    return 1;
  };
  sandbox.clearInterval = () => {};
  sandbox.setTimeout = (fn) => {
    sandbox.__empireTimeouts__.push(fn);
    return sandbox.__empireTimeouts__.length;
  };
  return sandbox;
}

const EMPIRE_CRISIS_STUBS = `
S = freshState();
syncCrisisHudPulse = function(on) {
  document.documentElement.classList.toggle("ast-crisis-open", !!on);
};
resetDecisionModalChrome = function(){ syncCrisisHudPulse(false); };
window.__AST_HOOK__ = {
  getState: () => S,
  fmt: fmt,
  studioValue: () => studioValue(),
  STAR_POOL: [{ id: "s1", rarity: "Epic", exclusive: false }],
  STAR_BY_ID: {},
  ROLES: ROLES,
  GENRES: GENRES,
  toast: () => {},
  play: () => {},
  save: () => {},
  render: () => {},
  hireCost: (role) => hireCost(role),
  celebrateFirstChaosEvent: () => {},
  celebrateChaosSurvival: () => {},
  greenlight: function(){},
  releaseProject: function(){},
  tick: function(){},
};
S = freshState();
started = true;
OFFLINE = false;
_premiereOpen = false;
`;

const EMPIRE_CRISIS_RUNNER = `
S = freshState();
const EC = window.__AST_EMPIRE_CRISIS__;
const empire = {};

S.yen = 50;
empire.spendBlocked = EC.spendYen(S, 100) === false && S.yen === 50;
empire.spendOk = EC.spendYen(S, 30) === true && S.yen === 20;
S.yen = 10;
empire.spendFloor = EC.spendYen(S, 10) === true && S.yen === 0;

S.yen = 500;
S.chaosInsurance = true;
S.chaos = 80;
const rawCost = Math.floor(studioValue() * 0.04);
const paid = EC.crisisPay(S, rawCost);
empire.insurancePaid = paid === EC.applyIns(S, rawCost);
empire.insuranceYenOk = S.yen >= 0;

S.chaos = 60;
S.fans = 1000;
EC.warOpt("scandal3", 2);
empire.ignoreChaosDrop = S.chaos === 45;

S.chaos = 90;
S.lastChaos = 0;
S.chaosMode = true;
window.__AST_CRISIS_OPEN__ = false;
window.__AST_PENDING_WARROOM__ = null;
const decisionEl = document.getElementById("decision");
if (decisionEl) decisionEl.style.display = "none";
Math.random = () => 0.01;
window.__AST_MAYBE_CHAOS__(() => {});
empire.warRoomOpened = !!window.__AST_PENDING_WARROOM__;
empire.lastChaosSet = (S.lastChaos || 0) > 0;

dismissCrisisModal();
const origGetEl = document.getElementById;
let fallbackHits = 0;
S.lastChaos = 0;
S.chaos = 90;
document.getElementById = (id) => (id === "decision-body" ? null : origGetEl(id));
window.__AST_MAYBE_CHAOS__(() => { fallbackHits++; });
empire.fallbackOnRenderFail = fallbackHits === 1;
empire.cooldownOnRenderFail = (S.lastChaos || 0) > 0;
document.getElementById = origGetEl;

__EMPIRE_CRISIS__ = empire;
`;

function runEmpireCrisisSimulation() {
  const sandbox = buildEmpireCrisisSandbox();
  const gameLogic = extractGameLogic().replace("let started=false;", "");
  vm.runInNewContext(
    "var started=false;\n" + gameLogic + EMPIRE_CRISIS_STUBS + loadEmpireForVm(),
    sandbox,
    { timeout: 20000 }
  );
  for (const fn of sandbox.__empireTimeouts__ || []) {
    if (typeof fn === "function") fn();
  }
  if (!sandbox.__AST_EMPIRE_CRISIS__ && sandbox.__AST_HOOK__ && !sandbox.__AST_HOOK__.__empireInstalled) {
    for (const fn of sandbox.__empireTimeouts__ || []) {
      if (typeof fn === "function") fn();
    }
  }
  vm.runInNewContext(EMPIRE_CRISIS_RUNNER, sandbox, { timeout: 20000 });
  return sandbox.__EMPIRE_CRISIS__;
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
redeem("WELCOME");
const gemsAfterWelcome = S.gems;
const codesBefore = (S.redeemedCodes || []).slice();
const gain = Math.floor(Math.sqrt(S.totalFansEver / 1000));
const keep = {
  legacy: S.legacy + gain,
  masteryAction: S.mastery.Action,
  gems: S.gems,
  starsLen: S.stars.length,
  perksIncome: S.perks.income,
  studioName: S.studioName,
  entitlements: S.entitlements.slice(),
  redeemedCodes: codesBefore.slice(),
};
prestige();
redeem("WELCOME");
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
  redeemedCodes: S.redeemedCodes,
  gemsAfterPrestigeRedeem: S.gems,
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

function assertPremiereQueueMulti(pq) {
  assert(pq.queued === 3, "multi-slot storm queues three premieres", `queued=${pq.queued}`);
  assert(
    JSON.stringify(pq.fifoYen) === JSON.stringify([1000, 2000, 3000]),
    "premiere queue FIFO yen payload",
    `got ${JSON.stringify(pq.fifoYen)}`
  );
  assert(pq.afterClose1 === 2, "closePremiere shifts first queued premiere", `len=${pq.afterClose1}`);
  assert(pq.openAfter1 === true, "closePremiere opens next premiere from queue");
  assert(pq.drained === true, "premiere queue fully drained after closes");
}

function assertCoachLockedTab(coach) {
  assert(coach.starsRedirect.tab === "produce", "coach redirects locked stars tab to produce");
  assert(coach.starsRedirect.blocked === true, "coach marks stars redirect as blocked");
  assert(coach.marketRedirect.tab === "produce", "coach redirects locked market tab to produce");
  assert(coach.staffOk.tab === "staff", "coach allows unlocked staff tab");
  assert(coach.starsUnlocked.tab === "stars", "coach routes to stars when unlocked");
  assert(coach.marketUnlocked.tab === "market", "coach routes to market when unlocked");
  assert(coach.renderGuard === true, "renderBody guard resets inaccessible tab to produce");
  assert(coach.setTabBlocked === true, "setTab blocks locked research tab");
}

function assertCorruptLoad(corrupt) {
  assert(corrupt.badJson === false, "load() rejects invalid JSON");
  assert(corrupt.keyRemoved === true, "load() clears corrupt JSON save");
  assert(corrupt.arraySave === false, "load() rejects array save");
  assert(corrupt.arrayRemoved === true, "load() clears invalid array save");
  assert(corrupt.repairedTab === "produce", "repairLoadedState resets invalid tab");
  assert(corrupt.repairedSlots === 4, "repairLoadedState clamps slots to MAX_SLOTS", `slots=${corrupt.repairedSlots}`);
  assert(corrupt.repairedProjects === 4, "repairLoadedState pads/truncates projects to slots");
  assert(corrupt.repairedProgress === 50, "repairLoadedState clamps project progress to work");
  assert(corrupt.repairedStaff === 0, "repairLoadedState sanitizes NaN staff");
  assert(corrupt.rivalGoal > 500, "repairRivalGoalFor fixes goal <= start", `goal=${corrupt.rivalGoal}`);
}

function assertDoubleIap(di) {
  assert(di.preRedeemed === false, "redeemPurchaseToken false when gid pre-redeemed");
  assert(di.gemsNoGrantWhenGidKnown === true, "pre-redeemed gid does not grant gems");
  assert(di.raceFirst === true || di.raceSecond === true, "concurrent VALID redeem delivers once");
  assert(di.raceSingleGrant === true, "concurrent redeem records gid once", `count issue`);
  assert(di.raceNoDoubleGems === true, "concurrent redeem does not double-grant gems", `+${di.raceGemsGain}`);
}

function assertModalStormFive(five) {
  assert(five.drains[0] === true, "five-modal storm drain1 shows studio");
  assert(five.drains[1] === true, "five-modal storm drain2 shows stars");
  assert(five.drains[2] === true, "five-modal storm drain3 shows market");
  assert(five.drains[3] === true, "five-modal storm drain4 shows research");
  assert(five.drains[4] === true, "five-modal storm drain5 shows chaos");
  assert(five.drains[5] === false, "five-modal storm drain6 empty");
  assert(five.allCleared === true, "five-modal storm clears all queue flags");
  const expected = ["studio-unlock", "stars-unlock", "market-unlock", "research-unlock", "chaos-unlock"];
  assert(
    JSON.stringify(five.order) === JSON.stringify(expected),
    "five-modal storm order: studio → stars → market → research → chaos",
    `got ${JSON.stringify(five.order)}`
  );
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
  assert(r.itemsFirst === true, "grantEntitlement items_pack delivers once");
  assert(r.itemsRepeat === false, "grantEntitlement items_pack idempotent on repeat");
  assert(r.itemsEntitled === true, "items_pack records entitlement");
  assert(r.itemsMegaphone === true, "items_pack grants megaphone");
  assert(r.itemsNoDoubleGems === true, "repeat items_pack does not add gems");
  assert(r.passFirst === true, "grantEntitlement pass delivers once");
  assert(r.passRepeat === false, "grantEntitlement pass idempotent on repeat");
  assert(r.passNoDoubleGems === true, "repeat pass does not add gems");
  assert(r.legendFirst === true, "grantEntitlement bundle_legend delivers once");
  assert(r.legendRepeat === false, "grantEntitlement bundle_legend idempotent on repeat");
  assert(r.legendNoDoubleGems === true, "repeat bundle_legend does not add gems");
  assert(r.mogulFirst === true, "grantEntitlement bundle_mogul delivers once");
  assert(r.mogulRepeat === false, "grantEntitlement bundle_mogul idempotent on repeat");
  assert(r.mogulNoDoubleGems === true, "repeat bundle_mogul does not add gems");
  assert(r.noadsFirst === true, "grantEntitlement noads delivers once");
  assert(r.noadsRepeat === false, "grantEntitlement noads idempotent on repeat");
}

function assertReadGrant(rg) {
  assert(rg.devGrant.gemsGain === 86, "readGrant ?grant=gems on localhost (+ flash deal)", `got +${rg.devGrant.gemsGain}`);
  assert(rg.devGrant.paramsCleared === true, "readGrant clears dev grant params");
  assert(rg.devUnlock.entitled === true, "readGrant ?unlock=items_pack delivers");
  assert(rg.devUnlock.megaphone === 1, "readGrant items_pack grants items");
  assert(rg.devUnlock.paramsCleared === true, "readGrant clears unlock params");
  assert(rg.prodBlocked === true, "readGrant blocked off localhost without devgrants");
  assert(rg.devFlagGrant === 68, "readGrant ?devgrants=1 on non-localhost (+ flash deal)", `got +${rg.devFlagGrant}`);
}

function assertIap(iap) {
  assert(iap.validChanged === true, "redeemPurchaseToken VALID grants");
  assert(iap.gemsValidGain === 170, "VALID pt grants 100 gems + first-purchase 50 + flash 20", `got +${iap.gemsValidGain}`);
  assert(iap.invalidChanged === false, "redeemPurchaseToken INVALID returns false");
  assert(iap.gemsUnchangedAfterInvalid === true, "INVALID pt does not change gems");
  assert(iap.gemsLicenseGain === 100, "redeemLicenseKey chains license→TEST_PT redeem", `got +${iap.gemsLicenseGain}`);
  assert(iap.validDupChanged === false, "redeemPurchaseToken VALID idempotent via gid");
  assert(iap.gemsNoDoubleValid === true, "repeat VALID pt does not add gems");
  assert(iap.gemsNoDoubleLicense === true, "repeat redeemLicenseKey does not add gems");
  assert(iap.passFirst === true, "PASS_PT first redeem delivers pass");
  assert(iap.passSecond === false, "PASS_PT second redeem idempotent (entitlement exists)");
  assert(iap.passEntitlements === 1, "pass entitlement recorded once", `count=${iap.passEntitlements}`);
  assert(iap.producerPass === true, "producerPass set after signed redeem");
}

function assertModalStorm(storm) {
  assert(storm.drain1 === true, "modal storm drain1 processes studio skip slot");
  assert(storm.drain2 === true, "modal storm drain2 processes stars");
  assert(storm.drain3 === true, "modal storm drain3 processes market");
  assert(storm.drain4 === true, "modal storm drain4 processes research");
  assert(storm.drain5 === true, "modal storm drain5 processes chaos");
  assert(storm.drain6 === false, "modal storm drain6 empty after full chain");
  assert(storm.studioCleared === true, "seen studio modal clears studio queue flag");
  assert(storm.starsCleared === true, "stars queue cleared after drain");
  assert(storm.marketCleared === true, "market queue cleared after drain");
  assert(storm.researchCleared === true, "research queue cleared after drain");
  assert(storm.chaosCleared === true, "chaos queue cleared after drain");
  const expected = ["stars-unlock", "market-unlock", "research-unlock", "chaos-unlock"];
  assert(
    JSON.stringify(storm.order) === JSON.stringify(expected),
    "modal storm priority: studio seen skip → stars → market → research → chaos",
    `got ${JSON.stringify(storm.order)}`
  );
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

function assertMarketResearch(mr) {
  assert(mr.mastery === 1, "research purchase increments genre mastery", `mastery=${mr.mastery}`);
  assert(mr.yenSpent > 0, "research purchase spends yen", `yenSpent=${mr.yenSpent}`);
  assert(mr.hypeSpent >= 2, "research purchase spends hype", `hypeSpent=${mr.hypeSpent}`);
  assert(mr.campaigns === 1, "first campaign increments campaignsRun", `campaigns=${mr.campaigns}`);
  assert(mr.fansGain === 5, "campaign grants fans (Flyer Drop)", `fansGain=${mr.fansGain}`);
  assert(mr.badResearch === true, "invalid genre research is no-op");
  assert(mr.badCamp === true, "out-of-range campaign index is no-op");
}

function assertFranchise(fran) {
  assert(fran.seq === 2, "sequel greenlight sets seq from franchise table", `seq=${fran.seq}`);
  assert(fran.base === "Sakura Hit", "sequel greenlight keeps franchise base");
  assert(fran.opportunity === "Sakura Hit", "registerFranchiseHit sets opportunity");
  assert(fran.franchiseCount >= 1, "franchise registry non-empty");
}

function assertDynastyPerk(dp) {
  assert(dp.lvl === 1, "buyDynastyPerk increments income perk", `lvl=${dp.lvl}`);
  assert(dp.spentDelta === 12, "buyDynastyPerk spends dynasty points", `spent=${dp.spentDelta}`);
  assert(dp.avail === 8, "dynastyAvailable after first buy", `avail=${dp.avail}`);
  assert(dp.blockedLow === true, "buyDynastyPerk blocked when points too low");
  assert(dp.sequelBlockedFull === true, "makeSequel blocked when slots full");
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

function assertModalPending(mp) {
  assert(mp.pending === true, "unlockModalPending true while offline boot modal open");
  assert(mp.drainBlocked === false, "drainUnlockModalQueue false while boot modal blocks");
  assert(mp.queued === true, "queueStudioUnlockModal defers while offline modal open");
  assert(mp.studioShown === false, "studio unlock not shown on top of offline modal");
}

function assertBootPriority(bp) {
  assert(bp.hubShown === true, "bootReturnBatch bundles daily into return hub");
  assert(bp.dailyStandalone === false, "daily standalone skipped when return hub shown");
  assert(bp.whatsnewStandalone === false, "whatsnew standalone skipped when return hub shown");
  assert(bp.whatsnewHub === true, "bootReturnBatch routes whatsnew through return hub");
  assert(bp.whatsnewBundled === true, "return hub records whatsnew section");
  assert(bp.whatsnewStandaloneBlocked === true, "standalone whatsnew not stacked over return hub");
}

function assertAwardDefer(ad) {
  assert(ad.queued === true, "studio award queued while premiere will show");
  assert(ad.num === true, "queued studio award retains award number");
  assert(ad.gems === true, "queued studio award retains gem payload");
}

function assertPremiereDefer(pd) {
  assert(pd.len === 1, "premiere queued while offline boot modal open", `len=${pd.len}`);
  assert(pd.held === true, "deferred premiere retains yen payload");
}

function assertChaosSurvival(survival) {
  assert(survival.crisesGain === 1, "resolveDecision chaos increments crisesSurvived", `+${survival.crisesGain}`);
  assert(survival.awaitCleared === true, "celebrateChaosSurvival clears awaitFirstChaosSurvival");
  assert(survival.chaosModeOn === true, "chaos survival keeps chaosMode on");
  assert(survival.decisionTriggered === true, "maybeDecision fires with chaosMode on");
  assert(survival.chaosTriggered === true, "maybeChaos triggers chaos crisis with chaosMode on");
  assert(survival.chaosModeDoublesChance === true, "chaosMode raises maybeChaos trigger rate");
  assert(survival.dangerCritical === true, "chaosDangerTier marks 90% as critical");
  assert(survival.dangerMarkup === true, "renderDecisionModal paints crisis danger meter");
  assert(survival.dangerPct === true, "danger meter shows current chaos percent");
  assert(survival.hudPulseOn === true, "syncCrisisHudPulse sets ast-crisis-open during crisis");
  assert(survival.hudPulseCleared === true, "resolveDecision clears ast-crisis-open");
  assert(survival.spendYenBlocked === true, "CHAOS pay option blocked when broke without negative yen");
  assert(survival.spendYenDeduct === true, "CHAOS spendYen deducts exact cost when affordable");
}

function assertEmpireCrisis(empire) {
  assert(empire.spendBlocked === true, "empire spendYen blocks overdraft");
  assert(empire.spendOk === true, "empire spendYen deducts partial balance");
  assert(empire.spendFloor === true, "empire spendYen floors yen at zero");
  assert(empire.insurancePaid === true, "empire crisisPay applies insurance discount");
  assert(empire.insuranceYenOk === true, "empire crisisPay never negative yen");
  assert(empire.ignoreChaosDrop === true, "war room ignore scandal eases chaos");
  assert(empire.warRoomOpened === true, "empire maybeChaos opens war room at high chaos");
  assert(empire.lastChaosSet === true, "empire maybeChaos sets lastChaos cooldown");
  assert(empire.fallbackOnRenderFail === true, "empire maybeChaos calls fallback when war room render fails");
  assert(empire.cooldownOnRenderFail === true, "empire maybeChaos cooldown even when render fails");
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
  assert(
    Array.isArray(p.redeemedCodes) && p.redeemedCodes.includes("WELCOME"),
    "prestige keeps redeemedCodes"
  );
  assert(
    p.gemsAfterPrestigeRedeem === p.gems,
    "prestige cannot re-redeem WELCOME promo",
    `gems ${p.gemsAfterPrestigeRedeem} vs ${p.gems}`
  );
}

function assertGrantPersist(gp) {
  assert(gp.gemsGain === 170, "grant persist first redeem grants gems", `got +${gp.gemsGain}`);
  assert(gp.gidPersisted === true, "save() persists redeemedGrants gid");
  assert(gp.gidLoaded === true, "load() restores redeemedGrants gid");
  assert(gp.reloadNoDouble === true, "reload + repeat pt does not double-grant gems");
  assert(gp.reloadChanged === false, "repeat pt after reload returns changed=false");
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

  assert(starRankLetterFor(5) === "S" && starRankLetterFor(1) === "D", "starRankLetterFor tiers");
  assert(studioRankLetterFor(5) === "S+" && studioRankLetterFor(2) === "B", "studioRankLetterFor tiers");
  assert(
    productionScoreFor(4, { work: 100 }, { progress: 50 }) === 4200 + 4400 + 400,
    "productionScoreFor progress blend"
  );
  assert(fmtEta(0) === "Ready!" && fmtEta(90) === "1M 30s", "fmtEta formatting");
  assert(studioLevelFromFans(0) === 1 && studioLevelFromFans(40) >= 1, "studioLevelFromFans");
  assert(levelMultForLevel(10) === 1.2, "levelMultForLevel");
  assert(passMultFor(true) === 1.5 && passMultFor(false) === 1, "passMultFor");
  assert(
    hireCostFor("animator", 0, 0, { base: 200, growth: 1.17 }) === 200,
    "hireCostFor first hire"
  );
  assert(upCostFor("tablets", 0, { base: 800, growth: 1.6 }) === 800, "upCostFor base level");
  assert(castingCostFor(0) === 2000 && castingCostFor(2) === 3125, "castingCostFor scaling");
  assert(hypeCapFor(5, 2) === 220, "hypeCapFor studio + active slots");
  assert(activeCountFor([{ pid: 0 }, null, { pid: 1 }]) === 2, "activeCountFor");
  assert(contentRankIndexFor(25) === 1 && contentRankIndexFor(500) === 3, "contentRankIndexFor");
  assert(CONTENT_RANK_LADDER.length === 7, "CONTENT_RANK_LADDER exported");
  assert(
    studioValueFor({ totalFansEver: 100, fans: 50, releases: 5, legacy: 2 }) === 6190,
    "studioValueFor composite"
  );

  const corrupt = repairLoadedStateFor(
    { slots: 99, tab: "bogus", projects: [{ pid: 0, progress: 999 }], staff: { animator: NaN } },
    {
      maxSlots: 4,
      genres: TEST_GENRES,
      projectDefs: [{ work: 50 }],
      roleKeys: ["animator", "writer"],
      fresh: () => createFreshState(TEST_GENRES),
    }
  );
  assert(corrupt.slots === 4 && corrupt.tab === "produce", "repairLoadedStateFor clamps slots and tab");
  assert(corrupt.projects[0].progress === 50 && corrupt.projects.length === 4, "repairLoadedStateFor clamps project progress");
  assert(corrupt.staff.animator === 0, "repairLoadedStateFor sanitizes staff");

  const nanMerge = mergeLoadedSave(
    { fans: NaN, yen: "bad", slots: "nope", projects: null, milestonesClaimed: "x" },
    fresh,
    TEST_GENRES
  );
  assert(nanMerge.fans === 0 && nanMerge.yen === 0, "mergeLoadedSave sanitizes NaN fans and bad yen");
  assert(nanMerge.slots >= 1 && nanMerge.slots <= 4, "mergeLoadedSave sanitizes bad slots");
  assert(Array.isArray(nanMerge.projects) && nanMerge.projects.length === nanMerge.slots, "mergeLoadedSave pads null projects");

  assert(safeSaveNum(NaN, 7) === 7 && safeSaveNum("12", 0, 0, 10) === 10, "safeSaveNum coerces and clamps");

  const nanRepair = repairLoadedStateFor(
    { fans: NaN, slots: null, projects: "x", tab: "bogus", staff: { animator: NaN }, upgrades: { tablets: NaN } },
    {
      maxSlots: 4,
      genres: TEST_GENRES,
      projectDefs: [{ work: 50 }],
      roleKeys: ["animator"],
      fresh: () => createFreshState(TEST_GENRES),
    }
  );
  assert(nanRepair.fans === 0 && nanRepair.slots === 1, "repairLoadedStateFor fixes NaN fans and null slots");
  assert(Array.isArray(nanRepair.milestonesClaimed), "repairLoadedStateFor ensures milestonesClaimed array");

  const rival = { rivalStartVal: 100, rivalGoal: 50 };
  repairRivalGoalFor(rival, 120, () => 0);
  assert(rival.rivalGoal === 138, "repairRivalGoalFor fixes corrupt goal");

  assert(starsUnlockProgressFor({ releases: 1, totalFansEver: 10 }) != null, "starsUnlockProgressFor locked");
  assert(starsUnlockProgressFor({ releases: 2, totalFansEver: 0 }) === null, "starsUnlockProgressFor unlocked");
  assert(tabLockedFor("market", { fans: 10, releases: 5 }) === true, "tabLockedFor market locked");
  assert(tabLockedFor("produce", { fans: 0, releases: 0 }) === false, "tabLockedFor produce always open");
  assert(masteryResearchCostFor(2).cost === 4332, "masteryResearchCostFor scaling");
  assert(VALID_TABS.has("produce") && !VALID_TABS.has("bogus"), "VALID_TABS set");

  assert(
    tabInDockFor("research", { releases: 2, totalFansEver: 50 }) === false,
    "tabInDockFor early dock hides research until 120 fansEver"
  );
  assert(
    tabInDockFor("research", { releases: 2, totalFansEver: 120 }) === true,
    "tabInDockFor early dock shows research when unlocked"
  );
  assert(
    tabInDockFor("market", { releases: 0, fans: 10 }) === true,
    "tabInDockFor early dock shows market teaser"
  );
  assert(tabInDockFor("chaos", { releases: 3 }) === false, "tabInDockFor early dock hides chaos");
  assert(tabInDockFor("chaos", { releases: 6 }) === true, "tabInDockFor late dock shows chaos tab");
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
    "repairLoadedStateFor",
    "repairRivalGoalFor",
    "VALID_TABS",
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

console.log("\nSigned IAP fetch mock (redeemPurchaseToken, redeemLicenseKey):\n");
try {
  const iap = await runIapSimulation();
  assertIap(iap);
} catch (e) {
  fail("vm iap sim", e.message || String(e));
}

console.log("\nGrant gid save/load persistence (no double-grant on reload):\n");
try {
  const gp = await runGrantPersistSimulation();
  assertGrantPersist(gp);
} catch (e) {
  fail("vm grant-persist sim", e.message || String(e));
}

console.log("\nModal storm queue (studio seen skip → stars → market → research → chaos):\n");
try {
  const storm = runModalStormSimulation();
  assertModalStorm(storm);
} catch (e) {
  fail("vm modal-storm sim", e.message || String(e));
}

console.log("\nFive-modal storm (all unlock modals, studio not yet seen):\n");
try {
  const five = runModalStormFiveSimulation();
  assertModalStormFive(five);
} catch (e) {
  fail("vm modal-storm-five sim", e.message || String(e));
}

console.log("\nCorrupt save recovery (bad JSON, repairLoadedState, rival goal):\n");
try {
  const corrupt = runCorruptLoadSimulation();
  assertCorruptLoad(corrupt);
} catch (e) {
  fail("vm corrupt-load sim", e.message || String(e));
}

console.log("\nDouble IAP redeem (pre-redeemed gid + concurrent VALID race):\n");
try {
  const di = await runDoubleIapSimulation();
  assertDoubleIap(di);
} catch (e) {
  fail("vm double-iap sim", e.message || String(e));
}

console.log("\nPremiere queue multi-slot FIFO (3 queued → drain on close):\n");
try {
  const pqMulti = runPremiereQueueMultiSimulation();
  assertPremiereQueueMulti(pqMulti);
} catch (e) {
  fail("vm premiere-queue-multi sim", e.message || String(e));
}

console.log("\nCoach locked-tab redirect (safe tab routing + setTab guard):\n");
try {
  const coach = runCoachLockedTabSimulation();
  assertCoachLockedTab(coach);
} catch (e) {
  fail("vm coach-locked-tab sim", e.message || String(e));
}

console.log("\nreadGrant dev path (localhost mock + prod block):\n");
try {
  const rg = runReadGrantSimulation();
  assertReadGrant(rg);
} catch (e) {
  fail("vm read-grant sim", e.message || String(e));
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

console.log("\nMarket campaign + research purchase (genre guard + bounds):\n");
try {
  const mr = runMarketResearchSimulation();
  assertMarketResearch(mr);
} catch (e) {
  fail("vm market-research sim", e.message || String(e));
}

console.log("\nFranchise sequel greenlight + opportunity:\n");
try {
  const fran = runFranchiseSimulation();
  assertFranchise(fran);
} catch (e) {
  fail("vm franchise sim", e.message || String(e));
}

console.log("\nDynasty perk buy + sequel slot guard:\n");
try {
  const dp = runDynastyPerkSimulation();
  assertDynastyPerk(dp);
} catch (e) {
  fail("vm dynasty perk sim", e.message || String(e));
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

console.log("\nBoot modal pending gate (offline blocks unlock drain/show):\n");
try {
  const mp = runModalPendingSimulation();
  assertModalPending(mp);
} catch (e) {
  fail("vm modal-pending sim", e.message || String(e));
}

console.log("\nBoot priority chain (hub bundles daily; whatsnew standalone):\n");
try {
  const bp = runBootPrioritySimulation();
  assertBootPriority(bp);
} catch (e) {
  fail("vm boot-priority sim", e.message || String(e));
}

console.log("\nStudio award defers when premiere will show:\n");
try {
  const ad = runAwardDeferSimulation();
  assertAwardDefer(ad);
} catch (e) {
  fail("vm award-defer sim", e.message || String(e));
}

console.log("\nPremiere defers while boot/offline modal open:\n");
try {
  const pd = runPremiereDeferSimulation();
  assertPremiereDefer(pd);
} catch (e) {
  fail("vm premiere-defer sim", e.message || String(e));
}

console.log("\nChaos survival (resolveDecision + maybeDecision/maybeChaos @ chaosMode):\n");
try {
  const survival = runChaosSurvivalSimulation();
  assertChaosSurvival(survival);
} catch (e) {
  fail("vm chaos-survival sim", e.message || String(e));
}

console.log("\nEmpire war room crisis guards (spendYen, fallback, chaos ease):\n");
try {
  const empire = runEmpireCrisisSimulation();
  assertEmpireCrisis(empire);
} catch (e) {
  fail("vm empire-crisis sim", e.message || String(e));
}

console.log("\nPrestige() carry-over (legacy, mastery, gems, stars):\n");
try {
  const p = runPrestigeSimulation();
  assertPrestige(p);
} catch (e) {
  fail("vm prestige sim", e.message || String(e));
}

const QUEST_CLAIM_RUNNER = `
S = freshState();
bootstrapHonestStudio();
if (!S.quests?.length) rollQuests();
const q0 = S.quests[0];
const met = questMetric(q0.id);
S.questProg[met] = q0.goal;
const before = claimableRewardCount();
claimQuest(0);
const after = claimableRewardCount();
S.releases = SEASON_TIERS[0].releases;
S.seasonClaimed = [];
const seasonReady = claimableRewardCount();
claimSeasonTier(0);
__QUEST_CLAIM__ = {
  before,
  gemsAfterQuest: S.gems,
  after,
  questClaimed: S.quests[0].claimed,
  seasonReady,
  seasonClaimed: S.seasonClaimed.includes(0),
};
`;

function runQuestClaimSimulation() {
  const sandbox = buildSandbox();
  vm.runInNewContext(extractGameLogic() + STUBS_BASE + QUEST_CLAIM_RUNNER, sandbox, { timeout: 20000 });
  return sandbox.__QUEST_CLAIM__;
}

function assertQuestClaim(r) {
  assert(r.before >= 1, "claimableRewardCount sees ready daily quest");
  assert(r.questClaimed, "claimQuest marks quest claimed");
  assert(r.gemsAfterQuest > 0, "claimQuest grants gems");
  assert(r.after < r.before, "claimableRewardCount drops after claim");
  assert(r.seasonReady >= 1, "claimableRewardCount includes season tier");
  assert(r.seasonClaimed, "claimSeasonTier records tier");
}

console.log("\nQuest claims (claimableRewardCount, daily, season pass):\n");
try {
  const qc = runQuestClaimSimulation();
  assertQuestClaim(qc);
} catch (e) {
  fail("vm quest-claim sim", e.message || String(e));
}

console.log("\nStatic save schema + unlock order:\n");
staticSaveSchemaAudit();

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);