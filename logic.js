// Pure game logic — state shape, balance constants, and math helpers.
// UI/render stays in index.html; tests may load this module via VM or import.

export const meta = { game: "anime-studio-tycoon", minPlayers: 1, maxPlayers: 1 };
export function setup() { return {}; }
export function validateAction() { return { ok: true }; }
export function applyAction(state) { return state; }
export function isGameOver() { return { over: false }; }
export function viewFor(state) { return state; }

export const MAX_SLOTS = 4;
export const EXPANSION_COST = [0, 15000, 90000, 500000]; // cost to reach slot 2,3,4 (index = current slots)

/** Progressive unlock thresholds as data (evaluated by featureUnlocked). */
export const UNLOCK_THRESHOLDS = {
  studio:  { label: "🏢 Studio Upgrades & Expansion", min: { releases: 1 } },
  stars:   { label: "⭐ Star Talent & Casting", any: [{ releases: 2 }, { totalFansEver: 20 }] },
  market:  { label: "📣 Marketing at 50 Fans", min: { fans: 50 } },
  research:{ label: "🔬 Genre Research", min: { totalFansEver: 120 } },
  chaos:   { label: "🌪️ Chaos Mode (high risk / high reward)", min: { releases: 10 } },
};

function meetsMin(S, min) {
  for (const [key, val] of Object.entries(min)) {
    if ((S[key] || 0) < val) return false;
  }
  return true;
}

export function featureUnlockedFor(k, S) {
  const t = UNLOCK_THRESHOLDS[k];
  if (!t) return true;
  if (t.any) return t.any.some((cond) => meetsMin(S, cond));
  if (t.min) return meetsMin(S, t.min);
  return true;
}

/** UI-compat registry: { test(), label } per unlock key (reads live state). */
export function makeUnlocks(getState) {
  return Object.fromEntries(
    Object.entries(UNLOCK_THRESHOLDS).map(([k, u]) => [
      k,
      { test: () => featureUnlockedFor(k, getState()), label: u.label },
    ])
  );
}

export function expandCostFor(S) {
  return EXPANSION_COST[S.slots] || 0;
}

/** Nested save defaults — shared by createFreshState and mergeLoadedSave. */
export const DEFAULT_STAFF = { animator: 0, writer: 0, director: 0, voice: 0, producer: 0 };
export const DEFAULT_UPGRADES = { tablets: 0, render: 0, sound: 0, marketing: 0, agency: 0 };
export const DEFAULT_QUEST_PROG = {
  releases: 0,
  yen: 0,
  campaigns: 0,
  hires: 0,
  hypeSpent: 0,
  scouts: 0,
  greenlit: 0,
  taps: 0,
};
export const DEFAULT_WEEK_PROG = { ...DEFAULT_QUEST_PROG };
export const DEFAULT_SETTINGS = {
  motion: true,
  ticker: true,
  musicVol: 0.35,
  sfxVol: 0.5,
  confirmGems: true,
  bgmTrack: "auto",
};
export const DEFAULT_PREMIERE_STATS = { fourPlus: 0, five: 0 };

export function defaultMastery(genres) {
  return Object.fromEntries(genres.map((g) => [g, 0]));
}

/** Coerce save numbers — NaN/Infinity/null → fallback, optional clamp. */
export function safeSaveNum(n, fallback = 0, min = -Infinity, max = Infinity) {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.min(max, Math.max(min, v));
}

/** Clamp core economy counters after corrupt merge or in-memory tampering. */
export function sanitizeSaveNumericsFor(S, _fresh = {}) {
  if (!S || typeof S !== "object") return S;
  S.yen = safeSaveNum(S.yen, 0, 0);
  S.fans = safeSaveNum(S.fans, 0, 0);
  S.hype = safeSaveNum(S.hype, 0, 0);
  S.totalFansEver = safeSaveNum(S.totalFansEver, 0, 0);
  S.releases = Math.floor(safeSaveNum(S.releases, 0, 0));
  S.gems = Math.floor(safeSaveNum(S.gems, 0, 0));
  S.catalogIncome = safeSaveNum(S.catalogIncome, 0, 0);
  S.legacy = safeSaveNum(S.legacy, 0, 0);
  S.stamina = safeSaveNum(S.stamina, 100, 0, 100);
  S.chaos = safeSaveNum(S.chaos, 0, 0);
  S.studioLevel = Math.max(1, Math.floor(safeSaveNum(S.studioLevel, 1, 1)));
  S.rivalStartVal = Math.floor(safeSaveNum(S.rivalStartVal, 0, 0));
  S.rivalGoal = Math.floor(safeSaveNum(S.rivalGoal, 0, 0));
  return S;
}

/** Valid main-tab ids — corrupt saves reset to produce. */
export const VALID_TABS = new Set([
  "produce",
  "quests",
  "staff",
  "stars",
  "research",
  "studio",
  "market",
  "store",
]);

/**
 * Repair in-memory save after load or corruption (mutates S).
 * Returns fresh() replacement when S is missing/invalid.
 */
export function repairLoadedStateFor(
  S,
  { maxSlots = MAX_SLOTS, genres = [], projectDefs = [], roleKeys = [], fresh = () => ({}), validTabs = VALID_TABS } = {}
) {
  if (!S || typeof S !== "object" || Array.isArray(S)) return fresh();
  sanitizeSaveNumericsFor(S);
  S.slots = Math.max(1, Math.min(maxSlots, Math.floor(safeSaveNum(S.slots, 1, 1, maxSlots))));
  if (!Array.isArray(S.projects)) S.projects = [];
  while (S.projects.length < S.slots) S.projects.push(null);
  S.projects = S.projects.slice(0, S.slots).map((pr) => {
    if (!pr || typeof pr !== "object") return null;
    const p = projectDefs[pr.pid];
    if (!p) return null;
    const prog = Number(pr.progress);
    pr.progress = Math.max(0, Math.min(p.work, Number.isFinite(prog) ? prog : 0));
    return pr;
  });
  const genreLen = Math.max(1, genres.length);
  S.trendIdx = Math.max(0, Math.min(genreLen - 1, Math.floor(safeSaveNum(S.trendIdx, 0, 0))));
  if (!validTabs.has(S.tab)) S.tab = "produce";
  S.fanMilestonesToast = Array.isArray(S.fanMilestonesToast) ? S.fanMilestonesToast : [];
  S.milestonesClaimed = Array.isArray(S.milestonesClaimed) ? S.milestonesClaimed : [];
  S.seasonClaimed = Array.isArray(S.seasonClaimed) ? S.seasonClaimed : [];
  if (!S.staff || typeof S.staff !== "object") S.staff = { ...DEFAULT_STAFF };
  for (const r of roleKeys) {
    if (typeof S.staff[r] !== "number" || !Number.isFinite(S.staff[r])) S.staff[r] = 0;
    else S.staff[r] = Math.max(0, Math.floor(S.staff[r]));
  }
  if (!S.upgrades || typeof S.upgrades !== "object") S.upgrades = { ...DEFAULT_UPGRADES };
  for (const k of Object.keys(DEFAULT_UPGRADES)) {
    S.upgrades[k] = Math.max(0, Math.floor(safeSaveNum(S.upgrades[k], 0, 0)));
  }
  return S;
}

/** Fix rival goal when save has goal <= start (corrupt or legacy). */
export function repairRivalGoalFor(S, currentStudioValue = 0, rng = Math.random) {
  if (!S || typeof S !== "object") return S;
  if (!S.rivalGoal || S.rivalGoal <= (S.rivalStartVal || 0)) {
    S.rivalGoal = rivalGoalFromStart(Math.max(S.rivalStartVal || 0, currentStudioValue, 1), rng);
  }
  return S;
}

/** Locked-tab copy for stars unlock (null when unlocked). */
export function starsUnlockProgressFor(S, fmtFn = String) {
  const rel = S.releases || 0;
  const fans = S.totalFansEver || 0;
  if (rel >= 2 || fans >= 20) return null;
  const needRel = Math.max(0, 2 - rel);
  if (needRel > 0) return needRel === 1 ? "1 more premiere to unlock Stars" : needRel + " more premieres to unlock Stars";
  const needFans = Math.max(0, 20 - fans);
  return needFans === 1 ? "1 more fan to unlock Stars" : fmtFn(needFans) + " more fans to unlock Stars";
}

export function marketUnlockProgressFor(S, fmtFn = String) {
  const fans = S.fans || 0;
  if (fans >= 50) return null;
  const need = 50 - fans;
  return need === 1 ? "1 more fan to unlock Marketing" : fmtFn(need) + " more fans to unlock Marketing";
}

export function studioUnlockProgressFor(S) {
  const rel = S.releases || 0;
  if (rel >= 1) return null;
  return "Premiere 1 anime to unlock Studio";
}

export function researchUnlockProgressFor(S, fmtFn = String) {
  const fans = S.totalFansEver || 0;
  if (fans >= 120) return null;
  const need = 120 - fans;
  return need === 1 ? "1 more fan to unlock Research" : fmtFn(need) + " more fans to unlock Research";
}

export function chaosUnlockProgressFor(S) {
  const rel = S.releases || 0;
  if (rel >= 10) return null;
  const need = 10 - rel;
  return need === 1 ? "1 more premiere to unlock Chaos" : need + " more premieres to unlock Chaos";
}

/** Whether tab appears in dock before release-5 cull. */
export function tabInDockFor(k, S) {
  if (k === "stars" && !featureUnlockedFor("stars", S)) return false;
  if ((S.releases || 0) < 1) {
    return ["produce", "quests", "staff"].includes(k);
  }
  if ((S.releases || 0) < 5) {
    if (k === "research") return featureUnlockedFor("research", S);
    return ["produce", "quests", "staff", "stars", "market", "studio", "store"].includes(k);
  }
  return true;
}

/** Whether tab is locked (dock hidden or feature gate). */
export function tabLockedFor(k, S) {
  if (!tabInDockFor(k, S)) return true;
  if (UNLOCK_THRESHOLDS[k] && !featureUnlockedFor(k, S)) return true;
  return false;
}

/** Genre mastery research yen + hype cost from current level. */
export function masteryResearchCostFor(lvl) {
  lvl = lvl || 0;
  return { lvl, cost: Math.ceil(1200 * Math.pow(1.9, lvl)), hypeCost: 2 + lvl };
}

export function tabUnlockPctFor(k, S, projectWorkFor) {
  if (featureUnlockedFor(k, S)) return null;
  const rel = S.releases || 0;
  const fans = S.fans || 0;
  const fansEver = S.totalFansEver || 0;
  if (k === "studio") {
    if (rel >= 1) return null;
    let best = 0;
    for (const pr of S.projects || []) {
      if (!pr) continue;
      const work = projectWorkFor ? projectWorkFor(pr.pid) : 0;
      if (!work) continue;
      best = Math.max(best, pr.progress / work);
    }
    return Math.round(Math.min(100, best * 100));
  }
  if (k === "stars") return Math.round(Math.min(100, Math.max(rel / 2, fansEver / 20) * 100));
  if (k === "market") return Math.round(Math.min(100, (fans / 50) * 100));
  if (k === "research") return Math.round(Math.min(100, (fansEver / 120) * 100));
  if (k === "chaos") return Math.round(Math.min(100, (rel / 10) * 100));
  return null;
}

/** Weekly rival target from studio value at week start; optional rng for tests. */
export function rivalGoalFromStart(start, rng = Math.random) {
  start = Math.max(0, Math.floor(start || 0));
  return Math.max(start + 1, Math.floor(start * (1.15 + rng() * 0.25)));
}

/**
 * Merge parsed save JSON onto a fresh state (pure). Caller runs normStars / rating init.
 */
export function mergeLoadedSave(d, fresh, genres, maxSlots = MAX_SLOTS) {
  const S = Object.assign({}, fresh, d);
  S.staff = Object.assign({}, DEFAULT_STAFF, d.staff || {});
  S.upgrades = Object.assign({}, DEFAULT_UPGRADES, d.upgrades || {});
  S.mastery = Object.assign(defaultMastery(genres), d.mastery || {});
  S.milestonesClaimed = Array.isArray(d.milestonesClaimed) ? d.milestonesClaimed : [];
  S.seasonClaimed = Array.isArray(d.seasonClaimed) ? d.seasonClaimed : [];
  S.gems = +d.gems || 0;
  S.producerPass = !!d.producerPass;
  S.bundleBought = !!d.bundleBought;
  S.slots = Math.max(1, Math.min(maxSlots, Math.floor(safeSaveNum(d.slots, fresh.slots, 1, maxSlots))));
  const projs = Array.isArray(d.projects) ? d.projects.slice() : d.project ? [d.project] : [];
  S.projects = Array.from({ length: S.slots }, (_, i) => projs[i] || null);
  S.lastDailyDate = d.lastDailyDate || "";
  S.dailyStreak = +d.dailyStreak || 0;
  S.stars = Array.isArray(d.stars) ? d.stars : [];
  if (S.stamina == null) S.stamina = 100;
  if (S.chaos == null) S.chaos = 0;
  S.items = d.items && typeof d.items === "object" ? d.items : {};
  S.entitlements = Array.isArray(d.entitlements) ? d.entitlements : [];
  S.hallOfFame = Array.isArray(d.hallOfFame) ? d.hallOfFame : [];
  S.studioName = d.studioName || "";
  S.unlockedSeen = Array.isArray(d.unlockedSeen) ? d.unlockedSeen : [];
  S.franchises = d.franchises && typeof d.franchises === "object" ? d.franchises : {};
  S.franchiseOpportunity =
    d.franchiseOpportunity && typeof d.franchiseOpportunity === "object" ? d.franchiseOpportunity : null;
  S.firstFranchiseCelebrated = !!d.firstFranchiseCelebrated;
  S.ageOk = !!d.ageOk;
  S.freeScoutUsed = !!d.freeScoutUsed;
  S.starsUnlockModalSeen = !!d.starsUnlockModalSeen;
  S.studioUnlockModalSeen = !!d.studioUnlockModalSeen;
  S.marketUnlockModalSeen = !!d.marketUnlockModalSeen;
  S.campaignsRun = +d.campaignsRun || 0;
  S.researchUnlockModalSeen = !!d.researchUnlockModalSeen;
  S.chaosUnlockModalSeen = !!d.chaosUnlockModalSeen;
  S.firstChaosToastSeen = !!d.firstChaosToastSeen;
  S.awaitFirstChaosSurvival = !!d.awaitFirstChaosSurvival;
  S.quests = Array.isArray(d.quests) ? d.quests : [];
  S.questProg = Object.assign({}, DEFAULT_QUEST_PROG, d.questProg || {});
  S.weekProg = Object.assign({}, DEFAULT_WEEK_PROG, d.weekProg || {});
  S.weeklyQuests = Array.isArray(d.weeklyQuests) ? d.weeklyQuests : S.weeklyQuests || [];
  S.weekKey = d.weekKey || S.weekKey || "";
  S.redeemedCodes = Array.isArray(d.redeemedCodes) ? d.redeemedCodes : [];
  S.redeemedGrants = Array.isArray(d.redeemedGrants) ? d.redeemedGrants : [];
  S.redeemedLicenses = Array.isArray(d.redeemedLicenses) ? d.redeemedLicenses : [];
  S.bestValue = +d.bestValue || 0;
  S.freeGemsDate = d.freeGemsDate || "";
  S.taps = +d.taps || 0;
  S.achievements = Array.isArray(d.achievements) ? d.achievements : [];
  S.whatsnewSeen = !!d.whatsnewSeen;
  S.pityCount = +d.pityCount || 0;
  S.merchLevel = +d.merchLevel || 0;
  S.autoGreenlight = !!d.autoGreenlight;
  S.rivalWins = +d.rivalWins || 0;
  S.rivalWeek = d.rivalWeek || "";
  S.rivalTarget = d.rivalTarget || null;
  S.rivalStartVal = +d.rivalStartVal || 0;
  S.rivalGoal = +d.rivalGoal || 0;
  S.rivalClaimed = !!d.rivalClaimed;
  S.plusCollection50 = !!d.plusCollection50;
  S.plusGoals = Array.isArray(d.plusGoals) ? d.plusGoals : [];
  S.plusGoalsDate = d.plusGoalsDate || "";
  S.plusGoalsBase = d.plusGoalsBase && typeof d.plusGoalsBase === "object" ? d.plusGoalsBase : {};
  S.settings =
    d.settings && typeof d.settings === "object"
      ? Object.assign({}, DEFAULT_SETTINGS, d.settings)
      : { ...DEFAULT_SETTINGS };
  S.marketShare = +d.marketShare || 5;
  S.bidsWon = +d.bidsWon || 0;
  S.bidWeek = d.bidWeek || "";
  S.bidResolved = !!d.bidResolved;
  S.activeBid = d.activeBid && typeof d.activeBid === "object" ? d.activeBid : null;
  S.endlessRisk = d.endlessRisk || "balanced";
  S.endlessDiff = d.endlessDiff || "standard";
  S.endlessCourMode = !!d.endlessCourMode;
  S.endlessEvents = +d.endlessEvents || 0;
  S.namedStaff = Array.isArray(d.namedStaff) ? d.namedStaff : [];
  S.empireSource = d.empireSource || "original";
  S.empireBlendGenre = d.empireBlendGenre != null ? +d.empireBlendGenre : -1;
  S.scoutBannerWeek = d.scoutBannerWeek || "";
  S.scoutBannerStar = d.scoutBannerStar || "";
  S.chaosInsurance = !!d.chaosInsurance;
  S.calmStreak = +d.calmStreak || 0;
  S.crisesSurvived = +d.crisesSurvived || 0;
  S.lastCrisisDay = d.lastCrisisDay || "";
  S.sparks = +d.sparks || 0;
  S.templates = Array.isArray(d.templates) ? d.templates : [];
  S.studioStars = Math.max(1, Math.min(5, +d.studioStars || 1));
  S.studioStarBest = Math.max(S.studioStars, +d.studioStarBest || S.studioStars);
  S.premiereStats =
    d.premiereStats && typeof d.premiereStats === "object" ? d.premiereStats : { ...DEFAULT_PREMIERE_STATS };
  S.studioStarPerks = d.studioStarPerks && typeof d.studioStarPerks === "object" ? d.studioStarPerks : {};
  S.crisisSnoozeUntil = +d.crisisSnoozeUntil || 0;
  S.ratingGuideSeen = !!d.ratingGuideSeen;
  S.loginStreak = +d.loginStreak || 0;
  S.loginStreakBest = +d.loginStreakBest || S.loginStreak;
  S.fanMilestonesToast = Array.isArray(d.fanMilestonesToast) ? d.fanMilestonesToast : [];
  sanitizeSaveNumericsFor(S, fresh);
  return S;
}

export function fmt(n) {
  n = Math.floor(n);
  if (!isFinite(n)) return "∞";
  if (n < 1000) return "" + n;
  const u = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc", "UDc", "DDc", "TDc"];
  let i = 0;
  let x = n;
  while (x >= 1000 && i < u.length - 1) {
    x /= 1000;
    i++;
  }
  return (x >= 100 ? x.toFixed(0) : x.toFixed(2).replace(/\.?0+$/, "")) + u[i];
}

export function fmtCompact(n) {
  const v = Math.abs(Math.round(n));
  if (v >= 1e6) return (v / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (v >= 1e3) return (v / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return fmt(v);
}

export function fmtYenCompact(n) {
  return "¥" + fmtCompact(n);
}

export function fmtLocale(n) {
  n = Math.floor(n);
  if (!isFinite(n)) return "0";
  return n.toLocaleString("en-US");
}

export function fmtHudRes(k, n) {
  if (k === "gems") return n >= 1000 ? fmtCompact(n) : fmtLocale(n);
  if (k === "yen") return "¥" + fmtCompact(n);
  if (k === "fans") return fmtCompact(n);
  return fmt(n);
}

/** Content rank ladder — fans thresholds for studio tier names. */
export const CONTENT_RANK_LADDER = [
  { fans: 0, icon: "🎬", name: "Garage", unlock: "Short Film" },
  { fans: 20, icon: "📱", name: "Buzz", unlock: "Web Series" },
  { fans: 120, icon: "📺", name: "Broadcast", unlock: "TV Series" },
  { fans: 500, icon: "💿", name: "Premium", unlock: "OVA" },
  { fans: 2200, icon: "🎥", name: "Cinema", unlock: "Feature Film" },
  { fans: 9000, icon: "🌟", name: "Blockbuster", unlock: "Mega Hit" },
  { fans: 25000, icon: "👑", name: "Legend", unlock: "Mythic" },
];

export function contentRankIndexFor(fans, ladder = CONTENT_RANK_LADDER) {
  let idx = 0;
  for (let i = 0; i < ladder.length; i++) {
    if (fans >= ladder[i].fans) idx = i;
  }
  return idx;
}

export function nextContentRankFor(fans, ladder = CONTENT_RANK_LADDER) {
  const idx = contentRankIndexFor(fans, ladder);
  return idx < ladder.length - 1 ? ladder[idx + 1] : null;
}

export function starRankLetterFor(stars) {
  return stars >= 5 ? "S" : stars >= 4 ? "A" : stars >= 3 ? "B" : stars >= 2 ? "C" : "D";
}

export function studioRankLetterFor(stars) {
  const s = stars || 1;
  return s >= 5 ? "S+" : s >= 4 ? "S" : s >= 3 ? "A" : s >= 2 ? "B" : "C";
}

export function productionScoreFor(stars, p, pr) {
  return Math.round(
    4200 + stars * 1100 + Math.min(800, ((pr.progress || 0) / Math.max(1, p.work)) * 800)
  );
}

export function fmtEta(sec) {
  if (sec <= 0) return "Ready!";
  if (sec >= 86400) return Math.floor(sec / 86400) + "D " + Math.floor((sec % 86400) / 3600) + "H";
  if (sec >= 3600) return Math.floor(sec / 3600) + "H " + Math.floor((sec % 3600) / 60) + "M";
  if (sec >= 60) return Math.floor(sec / 60) + "M " + (sec % 60) + "s";
  return sec + "s";
}

export function studioLevelFromFans(totalFansEver) {
  return Math.max(1, Math.floor(Math.pow(Math.max(0, totalFansEver) / 40, 0.37)));
}

export function fansForLevel(L) {
  return Math.ceil(40 * Math.pow(L, 1 / 0.37));
}

export function levelMultForLevel(L) {
  return 1 + L * 0.02;
}

export function passMultFor(producerPass) {
  return producerPass ? 1.5 : 1;
}

export function hireCostFor(role, staffCount, agencyLevel, roleDef) {
  const r = roleDef;
  if (!r) return 0;
  const n = staffCount || 0;
  const disc = Math.max(0.4, 1 - (agencyLevel || 0) * 0.05);
  return Math.ceil(r.base * Math.pow(r.growth, n) * disc);
}

export function upCostFor(key, level, upgradeDef) {
  const u = upgradeDef;
  if (!u) return 0;
  return Math.ceil(u.base * Math.pow(u.growth, level || 0));
}

export function castingCostFor(starCount) {
  return Math.ceil(2000 * Math.pow(1.25, starCount || 0));
}

export function hypeCapFor(studioLevel, activeProjectCount) {
  return 100 + (studioLevel || 1) * 20 + (activeProjectCount || 0) * 10;
}

export function activeCountFor(projects) {
  let n = 0;
  for (const p of projects || []) if (p) n++;
  return n;
}

export function firstEmptySlotFor(slots, projects) {
  const projs = projects || [];
  for (let i = 0; i < (slots || 1); i++) {
    if (!projs[i]) return i;
  }
  return -1;
}

export function studioValueFor(S) {
  return Math.floor(
    (S.totalFansEver || 0) + (S.fans || 0) + (S.releases || 0) * 8 + (S.legacy || 0) * 3000
  );
}

export function castCapFor(producerPass) {
  return 3 + (producerPass ? 1 : 0);
}

export function perkMultFor(perks, k) {
  return 1 + (((perks && perks[k]) || 0) * 0.05);
}

export function xpNeedFor(lvl) {
  return 8 + (lvl || 1) * 6;
}

export function showcaseBudgetFor(pr, p, pct) {
  if (pr.showcaseBudget) return [pr.showcaseBudget.spent, pr.showcaseBudget.cap];
  return [Math.round(p.cost * (pct / 100)), Math.round(p.cost * 1.15)];
}

export function slotEtaSecondsFor(pr, p, powerPerTick, showcaseEta = null) {
  if (pr.progress >= p.work) return 0;
  if (showcaseEta != null) return showcaseEta;
  return Math.ceil((p.work - pr.progress) / Math.max(0.0001, powerPerTick));
}

/** ISO week key e.g. "2026-W14 — used for weekly quest rotation. */
export function weekKeyStr(d = new Date()) {
  const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = dt.getUTCDay() || 7;
  dt.setUTCDate(dt.getUTCDate() + 4 - day);
  const ys = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
  const wk = Math.ceil(((dt - ys) / 86400000 + 1) / 7);
  return dt.getUTCFullYear() + "-W" + wk;
}

export function fmtDur(ms) {
  if (ms < 0) ms = 0;
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const mi = Math.floor((s % 3600) / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return d + "d " + (h % 24) + "h";
  if (h > 0) return h + "h " + mi + "m";
  return mi + "m";
}

export function createFreshState(genres) {
  return {
    yen: 1500,
    fans: 0,
    hype: 0,
    totalFansEver: 0,
    legacy: 0,
    catalogIncome: 0,
    totalEarned: 0,
    awardsWon: 0,
    legacySpent: 0,
    perks: { income: 0, speed: 0, fans: 0, offline: 0 },
    stamina: 100,
    chaos: 0,
    chaosMode: false,
    lastChaos: 0,
    lastStarDemand: 0,
    items: {},
    entitlements: [],
    purchaseLog: [],
    redeemedCodes: [],
    redeemedGrants: [],
    redeemedLicenses: [],
    firstPurchaseDone: false,
    noAds: false,
    wheelDate: "",
    scratchDate: "",
    studioName: "",
    hallOfFame: [],
    bestRank: 99,
    unlockedSeen: [],
    franchises: {},
    franchiseOpportunity: null,
    firstFranchiseCelebrated: false,
    ageOk: false,
    freeScoutUsed: false,
    starsUnlockModalSeen: false,
    studioUnlockModalSeen: false,
    marketUnlockModalSeen: false,
    campaignsRun: 0,
    researchUnlockModalSeen: false,
    chaosUnlockModalSeen: false,
    firstChaosToastSeen: false,
    awaitFirstChaosSurvival: false,
    gems: 0,
    gemSpent: false,
    producerPass: false,
    bundleBought: false,
    goldenUntil: 0,
    rewardedUntil: 0,
    rewardedCdUntil: 0,
    milestonesClaimed: [],
    seasonClaimed: [],
    slots: 1,
    projects: [null],
    staff: { ...DEFAULT_STAFF },
    stars: [],
    upgrades: { ...DEFAULT_UPGRADES },
    mastery: defaultMastery(genres),
    overdriveUntil: 0,
    trendIdx: 0,
    trendUntil: 0,
    releases: 0,
    quests: [],
    questProg: { ...DEFAULT_QUEST_PROG },
    weekKey: "",
    weeklyQuests: [],
    weekProg: { ...DEFAULT_WEEK_PROG },
    loginMonth: "",
    loginClaimedCount: 0,
    loginLastClaimDate: "",
    loginStreak: 0,
    loginStreakBest: 0,
    fanMilestonesToast: [],
    lastDecision: 0,
    studioLevel: 1,
    starterSeen: false,
    combo: 0,
    comboBest: 0,
    lastReleaseAt: 0,
    flashDealDay: "",
    flashSeen: false,
    lastDailyDate: "",
    dailyStreak: 0,
    bestValue: 0,
    freeGemsDate: "",
    taps: 0,
    sharedOnce: false,
    shareMilestoneSeen: false,
    tutorialSeen: false,
    whatsnewSeen: false,
    achievements: [],
    pityCount: 0,
    merchLevel: 0,
    autoGreenlight: false,
    rivalWins: 0,
    rivalWeek: "",
    rivalTarget: null,
    rivalStartVal: 0,
    rivalGoal: 0,
    rivalClaimed: false,
    plusGoals: [],
    plusGoalsDate: "",
    plusGoalsBase: {},
    plusCollection50: false,
    settings: { ...DEFAULT_SETTINGS },
    lastWhatsNewBuild: "",
    pwaInstallDismissed: false,
    pwaInstalled: false,
    pwaCoachSeen: false,
    pushNotifyOptIn: false,
    marketShare: 5,
    bidsWon: 0,
    bidWeek: "",
    bidResolved: false,
    endlessRisk: "balanced",
    endlessDiff: "standard",
    endlessCourMode: false,
    endlessEvents: 0,
    namedStaff: [],
    empireSource: "original",
    empireBlendGenre: -1,
    scoutBannerWeek: "",
    scoutBannerStar: "",
    chaosInsurance: false,
    calmStreak: 0,
    crisesSurvived: 0,
    lastCrisisDay: "",
    sparks: 0,
    templates: [],
    influence: 0,
    influenceSpent: 0,
    inflPerks: { income: 0, premiere: 0, chaos: 0 },
    streaming: [],
    recoveries: 0,
    ostTotal: 0,
    finalGuideSeen: false,
    finalGuideStep: 0,
    starStats: {},
    starContracts: {},
    festivalWins: [],
    directorsCuts: [],
    dynastyPoints: 0,
    autoRest: false,
    syndicationUntil: "",
    briefingDay: "",
    briefingPending: "",
    contractsSigned: 0,
    aaaQualityBoost: 0,
    aaaYenBoost: 0,
    dynastyPerks: { income: 0, premiere: 0, festival: 0 },
    dynastySpent: 0,
    studioStars: 1,
    studioStarBest: 1,
    premiereStats: { ...DEFAULT_PREMIERE_STATS },
    studioStarPerks: {},
    crisisSnoozeUntil: 0,
    ratingGuideSeen: false,
    peakDynasty: 0,
    dynastyRankUps: [],
    festivalLosses: 0,
    legendSlotDiscount: 0,
    careerYen: 0,
    careerFans: 0,
    firstFestivalWinSeen: false,
    lastSave: Date.now(),
    muted: false,
    tab: "produce",
    _demoMode: false,
    _bootstrapped: false,
    showcaseGlUsed: 0,
    _guidedFresh: false,
    _tutorialNameDone: false,
  };
}