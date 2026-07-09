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
};
export const DEFAULT_PREMIERE_STATS = { fourPlus: 0, five: 0 };

export function defaultMastery(genres) {
  return Object.fromEntries(genres.map((g) => [g, 0]));
}

/** Tab unlock ring progress 0–100, or null when unlocked / not applicable. */
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
  S.slots = Math.max(1, Math.min(maxSlots, d.slots || 1));
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
  if (k === "gems") return fmtLocale(n);
  if (k === "yen" || k === "fans") return fmtCompact(n);
  return fmt(n);
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