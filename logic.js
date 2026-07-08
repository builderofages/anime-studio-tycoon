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
    staff: { animator: 0, writer: 0, director: 0, voice: 0, producer: 0 },
    stars: [],
    upgrades: { tablets: 0, render: 0, sound: 0, marketing: 0, agency: 0 },
    mastery: Object.fromEntries(genres.map((g) => [g, 0])),
    overdriveUntil: 0,
    trendIdx: 0,
    trendUntil: 0,
    releases: 0,
    quests: [],
    questProg: { releases: 0, yen: 0, campaigns: 0, hires: 0, hypeSpent: 0, scouts: 0, greenlit: 0, taps: 0 },
    weekKey: "",
    weeklyQuests: [],
    weekProg: { releases: 0, yen: 0, campaigns: 0, hires: 0, hypeSpent: 0, scouts: 0, greenlit: 0, taps: 0 },
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
    settings: { motion: true, ticker: true, musicVol: 0.35, sfxVol: 0.5, confirmGems: true },
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
    premiereStats: { fourPlus: 0, five: 0 },
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