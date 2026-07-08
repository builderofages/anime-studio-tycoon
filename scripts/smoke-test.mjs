#!/usr/bin/env node
/**
 * Smoke test — static checks + strings module + syntax validation.
 * Run: npm test
 */
import { readFileSync, existsSync } from "fs";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0;
let failed = 0;

function ok(name) {
  passed++;
  console.log(`  ✓ ${name}`);
}
function fail(name, err) {
  failed++;
  console.error(`  ✗ ${name}: ${err}`);
}
function assert(cond, name, msg = "failed") {
  if (cond) ok(name);
  else fail(name, msg);
}

console.log("Anime Studio Tycoon — smoke test\n");

const required = [
  "index.html",
  "strings.js",
  "logic.js",
  "aaa-upgrade.js",
  "aaa-upgrade.css",
  "gameplay-plus.js",
  "gameplay-plus.css",
  "gameplay-ultra.js",
  "gameplay-ultra.css",
  "gameplay-endless.js",
  "gameplay-endless.css",
  "gameplay-empire.js",
  "gameplay-empire.css",
  "gameplay-studio.js",
  "gameplay-studio.css",
  "gameplay-final.js",
  "gameplay-final.css",
  "gameplay-aaa.js",
  "gameplay-aaa.css",
  "gameplay-legend.js",
  "gameplay-legend.css",
  "hud-premium.js",
  "hud-premium.css",
  "ui-complete.js",
  "ui-complete.css",
  "gameplay-studio-rating.js",
  "gameplay-studio-rating.css",
  "hook-bridge.js",
  "gameplay-polish.js",
  "v5-render-guard.js",
  "studio-premium.css",
  "game-skin.css",
  "hf-design.css",
  "aaa-ui.css",
  "legacy-fx.css",
  "ast-v5.css",
  "bg-v4.png",
  "start-hero.png",
  "assets/hf/gacha-bg.png",
  "assets/hf/greenlight-bg.png",
  "icons/hf/yen.png",
  "icons/hf/fans.png",
  "icons/hf/hype.png",
  "icons/hf/gems.png",
  "icons/tabs/produce.png",
  "icons/tabs/store.png",
  "manifest.json",
  "privacy.html",
  "terms.html",
  "scripts/prepare-native.mjs",
];
for (const f of required) {
  assert(existsSync(join(root, f)), `file exists: ${f}`);
}

const html = readFileSync(join(root, "index.html"), "utf8");
assert(!html.includes('${t("k_level"'), "no baked template literals in HTML");
assert(html.includes("window.__AST_HOOK__"), "AST hook exported");
assert(/src="aaa-upgrade\.js(\?v=\d+)?"/.test(html), "aaa-upgrade.js linked");
assert(/src="gameplay-plus\.js(\?v=\d+)?"/.test(html), "gameplay-plus.js linked");
assert(html.includes("pityCount"), "scout pity state");
assert(html.includes("merchLevel"), "merch line state");
assert(html.includes("autoGreenlight"), "auto-greenlight state");
assert(html.includes("marketShare"), "market share state");
assert(html.includes("applyAudioSettings"), "audio settings");
assert(/src="gameplay-ultra\.js(\?v=\d+)?"/.test(html), "gameplay-ultra.js linked");
assert(/src="gameplay-endless\.js(\?v=\d+)?"/.test(html), "gameplay-endless.js linked");
assert(html.includes("endlessRisk"), "endless risk state");
assert(html.includes("endlessDiff"), "endless difficulty state");
assert(html.includes("projectStars"), "projectStars on hook");
assert(/src="gameplay-empire\.js(\?v=\d+)?"/.test(html), "gameplay-empire.js linked");
assert(html.includes("namedStaff"), "named staff state");
assert(html.includes("pullStar"), "pullStar on hook");
assert(/src="gameplay-studio\.js(\?v=\d+)?"/.test(html), "gameplay-studio.js linked");
assert(html.includes("sparks"), "spark currency state");
assert(html.includes("__AST_CONFIRM__"), "in-theme confirm hook");
assert(/src="gameplay-final\.js(\?v=\d+)?"/.test(html), "gameplay-final.js linked");
assert(html.includes("influence"), "influence currency state");
assert(html.includes("streaming"), "streaming contracts state");
assert(html.includes("_finalReleaseMult"), "final release multiplier");
assert(/src="gameplay-aaa\.js(\?v=\d+)?"/.test(html), "gameplay-aaa.js linked");
assert(html.includes("dynastyPoints"), "dynasty points state");
assert(html.includes("festivalWins"), "festival wins state");
assert(html.includes("_aaaReleaseMult"), "aaa release multiplier");
assert(html.includes("window.ACHIEVEMENTS"), "achievements exposed for aaa popups");
assert(/src="gameplay-legend\.js(\?v=\d+)?"/.test(html), "gameplay-legend.js linked");
assert(html.includes("dynastyPerks"), "dynasty perks state");
assert(html.includes("_legendReleaseMult"), "legend release multiplier");
assert(/src="hud-premium\.js(\?v=\d+)?"/.test(html), "hud-premium.js linked");
assert(html.includes("hud-premium.css"), "hud-premium.css linked");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("pathway-rail"), "pathway rail in hud script");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("hud-v3"), "hud v3 shell");
assert(/src="ui-complete\.js(\?v=\d+)?"/.test(html), "ui-complete.js linked");
assert(readFileSync(join(root, "ui-complete.js"), "utf8").includes("ui-tab-hero"), "tab hero layouts");
assert(/src="gameplay-studio-rating\.js(\?v=\d+)?"/.test(html), "gameplay-studio-rating.js linked");
assert(html.includes("gameplay-studio-rating.css"), "gameplay-studio-rating.css linked");
assert(html.includes("studioStars"), "studio star rating state");
assert(html.includes("starUnlock"), "project star gates");
assert(readFileSync(join(root, "gameplay-studio-rating.js"), "utf8").includes("jw-studio-rank"), "JW rating HUD");
assert(/src="hook-bridge\.js(\?v=\d+)?"/.test(html), "hook-bridge.js linked");
assert(readFileSync(join(root, "hook-bridge.js"), "utf8").includes("__globalsRebound"), "hook global rebind");
assert(readFileSync(join(root, "gameplay-aaa.js"), "utf8").includes("__aaaLayerInstalled"), "aaa layer install flag");
assert(html.includes("hire,") && html.includes("expandStudio,"), "hire/expand on hook");
assert(/src="gameplay-polish\.js(\?v=\d+)?"/.test(html), "gameplay-polish.js linked");
assert(html.includes("crisisSnoozeUntil"), "crisis snooze state");
assert(html.includes('id:"rat5"'), "studio rating achievements");
assert(!html.includes('href="studio-premium.css'), "studio-premium.css disabled (ast-v5)");
assert(!html.includes('href="gameplay-plus.css'), "gameplay-plus.css disabled (ast-v5)");
assert(!html.includes('href="game-skin.css'), "game-skin.css not linked (ast-v5 authority)");
assert(!html.includes('href="hf-design.css'), "hf-design.css disabled (ast-v5)");
assert(!html.includes('href="aaa-ui.css'), "aaa-ui.css disabled (ast-v5)");
assert(html.includes("legacy-fx.css"), "legacy-fx css linked");
assert(html.includes("ast-v5.css"), "ast-v5 design css linked");
assert(html.includes("build 93"), "build 93 tag");
assert(html.includes("Production Score"), "production score label");
assert(html.includes("Empire"), "build 93 empire tag");
assert(html.includes("OFFLINE_PREVIEW_CAP"), "offline preview cap constant");
assert(html.includes("renderOfflineBreakdown"), "offline breakdown renderer");
assert(html.includes("showOfflineModal"), "offline modal helper");
assert(html.includes("showWhileAwayPreviewToast"), "while away preview toast");
assert(html.includes("idleIncomeTooltip"), "idle income tooltip helper");
assert(html.includes("aaa-offline-modal"), "offline modal markup");
assert(html.includes("aaa-produce-idle-footer"), "produce idle income footer");
assert(html.includes("aaa-offline-pass"), "producer pass offline callout");
assert(html.includes("royaltyPerSec,"), "royaltyPerSec on hook");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("idleIncomeTooltip"), "hud idle income tooltip");
assert(html.includes("studioStatCardsHTML"), "studio stat cards helper");
assert(html.includes("miniDashStripHTML"), "quests mini dashboard strip");
assert(html.includes("studioRankStripHTML"), "studio rank progression strip");
assert(html.includes("CONTENT_RANK_LADDER"), "content rank ladder");
assert(html.includes("queueShareMilestoneModal"), "100-fan share milestone modal");
assert(html.includes('id="share-milestone"'), "share milestone overlay");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("studioRankUpCoach"), "coach studio rank-up nudge");
assert(readFileSync(join(root, "gameplay-studio-rating.js"), "utf8").includes("studioRankProgress"), "studio rank progress hook");
assert(html.includes('id="chaos-unlock"'), "chaos unlock modal");
assert(html.includes("chaosUnlockProgress"), "chaos unlock progress helper");
assert(html.includes("celebrateFirstChaosEvent"), "first chaos event celebration");
assert(html.includes("celebrateChaosSurvival"), "chaos survival toast");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("hud-chaos-pill"), "chaos meter hud pill");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("premieres to unlock Chaos Mode"), "coach locked chaos hint");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("Chaos Mode unlocked"), "coach chaos enable nudge");
assert(readFileSync(join(root, "gameplay-endless.js"), "utf8").includes("S.chaosMode"), "endless chaos mode synergy");
assert(html.includes('id="market-unlock"'), "market unlock modal");
assert(html.includes("marketUnlockProgress"), "market unlock progress helper");
assert(html.includes("firstcamp"), "first campaign achievement");
assert(html.includes("celebrateCampaignRun"), "campaign run celebration");
assert(html.includes("aaa-market-roi"), "campaign roi preview");
assert(html.includes("aaa-market-afford"), "market afford glow");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("fanMilestoneMarketCoach"), "coach fan milestone market");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("Marketing unlocked"), "coach market unlock tip");
assert(html.includes("aaa-store-balance-hero"), "store balance hero");
assert(html.includes("aaa-free-gems-btn"), "free gems claim cta");
assert(html.includes("gemSpendRow"), "gem spend best-for rows");
assert(html.includes("aaa-ach-next"), "next achievement progress card");
assert(html.includes("nextAchievement"), "next achievement helper");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("free gems ready"), "store tab badge free gems");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("free +10"), "coach free gems nudge");
assert(html.includes("prem-second-ribbon"), "second premiere celebration");
assert(html.includes("FAN_TOAST_MILESTONES"), "fan milestone toasts");
assert(html.includes("checkFanMilestoneToasts"), "fan milestone toast check");
assert(html.includes("allGoalMilestones"), "goal bar fan milestone sync");
assert(html.includes("aaa-login-streak-hero"), "prominent login streak ui");
assert(html.includes("aaa-gl-trend-suggest"), "trending genre suggest banner");
assert(html.includes("applyTrendingGenreSuggest"), "trending genre suggest action");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("rival-race"), "rival race widget");
assert(html.includes("SHARE_PLAY_URL"), "canonical share play url");
assert(html.includes("showAchievePop"), "achievement popup helper");
assert(html.includes("firsthire"), "first hire achievement");
assert(html.includes("ROLE_BLURBS"), "staff role blurbs");
assert(html.includes("aaa-staff-afford"), "staff affordability glow");
assert(html.includes("celebrateFirstHire"), "first hire celebration");
assert(html.includes("data-staff-hire"), "staff hire data attrs");
assert(html.includes("staff-hero-cta"), "staff hero hire CTA");
assert(html.includes("staff-hire-primary"), "primary staff hire button id");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("staffHireTutorialTarget"), "guided hire spotlight helper");
assert(html.includes("isGuidedTutorialEligible"), "guided tutorial eligibility");
assert(html.includes("completeTutorial"), "completeTutorial hook");
assert(html.includes("_guidedFresh"), "honest fresh tutorial flag");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("GUIDED_STEPS"), "guided tutorial steps");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("guided-tutorial"), "guided tutorial overlay");
assert(html.includes('id="btn-start-play"'), "start play cta");
assert(html.includes('id="btn-start-demo"'), "start demo cta");
assert(html.includes("start-cta-group"), "start cta group");
assert(html.includes("Build 93"), "what's new build 93");
assert(html.includes("Studio Dashboard"), "what's new studio dashboard");
assert(html.includes("studio kept buzzing"), "offline collect celebration copy");
assert(html.includes("aaa-produce-slot-hud"), "multi-slot produce hud strip");
assert(html.includes("aaa-slot-carousel"), "swipeable produce slot carousel");
assert(html.includes("produce-slot-tab"), "produce slot switcher tabs");
assert(html.includes("focusProduceSlot"), "focus produce slot helper");
assert(html.includes("lines active"), "produce lines active copy");
assert(html.includes("aaa-slot-empty-cta"), "empty slot greenlight cta card");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("fill your open slot"), "coach fill open slot tip");
assert(html.includes("aaa-reveal-staged"), "scout reveal staged animation");
assert(html.includes("aaa-reveal-stage-portrait"), "scout reveal portrait stage");
assert(html.includes("batchHireSuggestion"), "batch hire suggestion helper");
assert(html.includes("aaa-staff-batch-suggest"), "staff batch hire ui");
assert(html.includes("hireBatch"), "batch hire action");
assert(html.includes("syncGlSelectionAfterGenreFilter"), "gl genre filter selection sync");
assert(html.includes("aaa-premiere-ready-glow"), "premiere-ready glow cta class");
assert(html.includes("isDemoMode"), "demo mode url param");
assert(html.includes("EARLY_QUEST_POOL"), "early quest pool");
assert(html.includes("EARLY_WEEKLY_POOL"), "early weekly pool");
assert(html.includes("slotEtaSeconds"), "honest slot eta helper");
assert(html.includes("weeklyPoolFor"), "weekly pool tiering");
assert(html.includes("prem-first-ribbon"), "first premiere celebration");
assert(html.includes("aaa-post-prem-cta"), "post-premiere quick gl banner");
assert(html.includes("bootstrapHonestStudio"), "honest player bootstrap");
assert(!html.includes("html.hud-v3-active #goal{display:none"), "goal bar not hidden in hud v3");
assert(html.includes('class="aaa-gl-name-ja"'), "japanese primary gl title");
assert(html.includes("aaa-gl-slots-label"), "greenlight slots label layout");
assert(html.includes("animator:{lv:60,rank:\"S\"}"), "character design s rank");
assert(html.includes("showcaseHypePct"), "showcase hype bar lock");
assert(html.includes("hypeBarPct"), "hype bar pct helper");
assert(html.includes("SHOWCASE_TEAM"), "showcase team level lock");
assert(html.includes("isShowcaseDemo"), "showcase demo hook export");
assert(html.includes("aaa-gl-confirm-main"), "greenlight confirm two-line layout");
assert(html.includes("hudDisplayValue"), "context hud values");
assert(html.includes("hudHypeCap"), "context hype cap");
assert(html.includes("125600000"), "greenlight showcase yen");
assert(html.includes("showcaseCost"), "greenlight showcase budgets");
assert(html.includes("showcaseGlUsed"), "greenlight slots showcase");
assert(html.includes("showcaseRewards"), "greenlight showcase rewards");
assert(html.includes("放課後コメディ"), "after school japanese title");
assert(html.includes("fmtHudRes"), "hud resource formatter");
assert(html.includes("aaa-gl-open-hot"), "multi-slot greenlight cta");
assert(html.includes("BUDGET ALLOCATION"), "greenlight budget header");
assert(html.includes('data-g="6"'), "drama genre filter chip");
assert(html.includes("showcaseChip"), "showcase drama chip");
assert(html.includes("showcaseRank"), "showcase s rank lock");
assert(html.includes("genreChipLabel"), "genre chip label helper");
assert(html.includes("The Revenger"), "revenger showcase title");
assert(html.includes("showcaseScore"), "showcase score lock");
assert(html.includes("ESTIMATED REWARDS"), "greenlight rewards header");
assert(html.includes("showcaseBudget"), "showcase budget helper");
assert(html.includes("showcaseEta"), "showcase premiere eta");
assert(html.includes("fmtEta"), "eta formatter");
assert(html.includes("aaa-gl-confirm-cost"), "greenlight slot cost badge");
assert(html.includes("aaa-genre-wrap"), "genre row scroll wrap");
assert(html.includes("projectHypeDisplay"), "per-project hype display");
assert(html.includes("fmtLocale"), "locale score formatting");
assert(html.includes("aaa-gl-pie-center"), "pie chart center total");
assert(html.includes("Sakura no Yakusoku"), "showcase produce bootstrap title");
assert(readFileSync(join(root, "index.html"), "utf8").includes("pr.progress=Math.floor(p.work*0.78)"), "ep 10/12 bootstrap progress");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("glView ? false"), "awards on greenlight view");
assert(readFileSync(join(root, "package.json"), "utf8").includes('"overrides"'), "npm overrides");
assert(existsSync(join(root, "scripts/audit-check.mjs")), "audit check script");
const astCss = readFileSync(join(root, "ast-v5.css"), "utf8");
assert(astCss.includes("BUILD 93"), "build 93 css marker");
assert(astCss.includes("aaa-offline-modal"), "offline modal css");
assert(astCss.includes("aaa-produce-idle-footer"), "produce idle footer css");
assert(astCss.includes("aaa-produce-slot-hud"), "multi-slot produce hud css");
assert(astCss.includes("aaa-slot-carousel"), "produce slot carousel css");
assert(astCss.includes("aaa-staff-batch-suggest"), "staff batch hire css");
assert(astCss.includes("aaa-stat-cards"), "studio stat cards css");
assert(astCss.includes("aaa-mini-dash"), "quests mini dash css");
assert(astCss.includes("aaa-rank-strip"), "studio rank path css");
assert(astCss.includes("aaa-share-milestone-modal"), "share milestone modal css");
assert(astCss.includes("aaa-reveal-staged"), "scout reveal staged css");
assert(astCss.includes("ast-free-gems-pulse"), "free gems pulse animation");
assert(astCss.includes("ast-market-afford-pulse"), "market afford pulse animation");
assert(astCss.includes("aaa-market-unlock-modal"), "market unlock modal css");
assert(astCss.includes("aaa-chaos-unlock-modal"), "chaos unlock modal css");
assert(astCss.includes("hud-chaos-pill"), "chaos hud pill css");
assert(astCss.includes("premiere-cta-glow"), "premiere-ready glow animation");
assert(astCss.includes("--gl-peek-inset"), "carousel peek inset token");
assert(astCss.includes(".aaa-gl-page .aaa-genre-wrap") && astCss.includes("position: sticky"), "sticky genre filter row");
assert(astCss.includes("gt-tutorial-active"), "guided tutorial spotlight css");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("w_rel"), "weekly quest metric map");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("tab-has-badge"), "dock tab badge class");
assert(astCss.includes(".start-cta-group"), "start cta styles");
assert(astCss.includes(".tab .tab-lbl") && astCss.includes("display: block"), "dock tab labels visible");
const astLines = astCss.split("\n").length;
assert(astLines < 4100, "ast-v5.css under 4100 lines", `${astLines} lines`);
assert(astCss.includes("BUILD 73 — CSS Prune"), "build 73 css marker");
assert(!astCss.includes("BUILD 55 —"), "dead build 55 section removed");
assert(existsSync(join(root, "scripts/prune-ast-v5.mjs")), "prune script exists");
assert(readFileSync(join(root, "ast-v5.css"), "utf8").includes("--gl-card-w"), "greenlight layout tokens");
assert(readFileSync(join(root, "ast-v5.css"), "utf8").includes("aaa-gl-page .aaa-gl-carousel"), "scoped gl carousel canon");
assert(html.includes("scrollIntoView"), "carousel center scrollIntoView");
assert(html.includes("aaa-hero-block"), "unified produce hero block");
assert(html.includes("POSTER_META"), "poster overlay metadata");
assert(html.includes("fmtYenCompact"), "compact yen formatting");
assert(html.includes("scrollSelectedGlCard"), "greenlight carousel center snap");
assert(html.includes("aaa-gl-slots-plus"), "greenlight slots expand button");
assert(html.includes("TAB_ORDER_EARLY"), "mockup tab order");
assert(html.includes("hypeCap"), "hype cap display");
assert(html.includes("isGreenlightView"), "greenlight view state");
assert(html.includes("syncMainViewState"), "main view dataset sync");
assert(readFileSync(join(root, "aaa-upgrade.js"), "utf8").includes("fx-canvas-lite"), "lightweight fx canvas in hud v3");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("hud-back-btn"), "hud back button");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("hud-gl-view"), "context stat toggle");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("Hire a Director"), "coach director tip");
assert(html.includes("TAB_MOCKUP"), "mockup tab labels");
assert(html.includes("Sakura Films"), "default studio name from ref");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("hud-mail-btn"), "hud mail button");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("demoDots"), "showcase demo notification dots");
assert(html.includes("GENRE_ICONS"), "genre filter icons");
assert(html.includes("aaa-gl-confirm-banner"), "greenlight banner CTA");
assert(html.includes("aaa-gl-name-ja"), "showcase japanese titles");
assert(html.includes("v5-slim-gate.js"), "v5 slim gate linked");
assert(html.includes("aaa-ep-pill"), "EP pill on stats panel");
assert(html.includes("studioRankLetter"), "studio rank letter helper");
assert(existsSync(join(root, "v5-slim-gate.js")), "v5-slim-gate.js exists");
assert(html.includes("GREENLIGHT_SHOWCASE"), "greenlight showcase catalog");
assert(html.includes("renderGreenlightPage"), "full-screen greenlight page");
assert(html.includes("aaa-gl-page"), "greenlight page class");
assert(html.includes("greenlight-view"), "greenlight view toggle");
assert(html.includes("aaa-gl-carousel"), "greenlight carousel");
assert(html.includes("aaa-gl-detail"), "greenlight analytics deck");
assert(readFileSync(join(root, "v5-render-guard.js"), "utf8").includes("aaa-tab-page"), "nuclear main guard");
assert(!html.includes('href="gameplay-studio-rating.css'), "studio-rating css disabled");
assert(!readFileSync(join(root, "hud-premium.js"), "utf8").includes("coach-mail"), "coach mail removed");
assert(html.includes("aaa-premiere-bonus-label"), "mockup premiere bonus label");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes('type: "hire"'), "coach one-tap hire");
assert(html.includes("S.releases<=3"), "early premiere celebration");
assert(html.includes("aaa-research-hero"), "research glass hero");
assert(html.includes("aaa-minigame-panel"), "minigame glass panel");
assert(readFileSync(join(root, "ast-v5.css"), "utf8").includes("#loading-splash"), "loading splash in ast-v5");
assert(html.includes("START PRODUCTION")||html.includes("quick-greenlight"), "ultra-simple first greenlight");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes('type: "premiere"'), "coach one-tap premiere");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes('type: "claim-reward"'), "coach one-tap claim");
assert(html.includes("quickGreenlight,"), "quickGreenlight on hook");
assert(html.includes("claimFirstReward,"), "claimFirstReward on hook");
assert(html.includes("aaa-staff-rank"), "staff rank badges");
assert(html.includes("aaa-quest-hero"), "quests glass hero");
assert(html.includes("v5-render-guard.js"), "v5 render guard linked");
assert(readFileSync(join(root, "hook-bridge.js"), "utf8").includes("__v5GuardInstalled"), "v5 guard in hook bridge");
assert(readFileSync(join(root, "v5-render-guard.js"), "utf8").includes("smart-cast-bar"), "smart-cast guard fix");
assert(html.includes("bootstrapNewStudio"), "new player bootstrap");
assert(html.includes("ensurePlayable"), "stuck save repair");
assert(html.includes("quick-greenlight"), "quick greenlight button");
assert(html.includes("tabAccessible"), "progressive tab unlock");
assert(html.includes('id="stars-unlock"'), "stars unlock modal");
assert(html.includes("starsUnlockProgress"), "stars unlock progress helper");
assert(html.includes("freeScoutAvailable"), "free scout helper");
assert(html.includes("1 more premiere to unlock Stars"), "locked stars tab progress copy");
assert(html.includes("starsPityHTML"), "stars pity hero helper");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("Stars unlocked"), "coach stars unlock tip");
assert(html.includes('id="studio-unlock"'), "studio unlock modal");
assert(html.includes("studioUnlockProgress"), "studio unlock progress helper");
assert(html.includes("Premiere 1 anime to unlock Studio"), "locked studio tab progress copy");
assert(html.includes("queueStudioUnlockModal"), "studio unlock modal queue");
assert(html.includes("celebrateFirstExpand"), "first slot expansion celebration");
assert(html.includes("aaa-studio-expand-card"), "studio expansion featured card");
assert(html.includes("aaa-studio-expand-afford"), "studio expansion afford glow");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes('type: "studio-expand"'), "coach studio expansion tip");
assert(astCss.includes("aaa-studio-unlock-modal"), "studio unlock modal css");
assert(astCss.includes("aaa-studio-expand-afford"), "studio expansion afford css");
assert(html.includes('id="research-unlock"'), "research unlock modal");
assert(html.includes("researchUnlockProgress"), "research unlock progress helper");
assert(html.includes("1 more fan to unlock Research"), "locked research tab progress copy");
assert(html.includes("queueResearchUnlockModal"), "research unlock modal queue");
assert(html.includes("celebrateFirstResearch"), "first research celebration");
assert(html.includes("aaa-research-trend-banner"), "research trending banner");
assert(html.includes("aaa-mastery-trend"), "trending mastery card highlight");
assert(html.includes("aaa-mastery-genre-ic"), "mastery genre icons");
assert(html.includes("researchCost"), "research cost helper on hook");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("Research ${trend}"), "coach trending research tip");
assert(astCss.includes("aaa-research-unlock-modal"), "research unlock modal css");
assert(astCss.includes("aaa-mastery-trend"), "mastery trend css");
assert(html.includes("hireCost,"), "hireCost on hook for tab badges");
assert(html.includes("estimatePremiere"), "premiere bonus estimator");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("coach-gift"), "coach gift button");
assert(html.includes("premium-hud"), "early premium-hud class");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("hud-studio-rating"), "rating in hud shell");
const hudJs = readFileSync(join(root, "hud-premium.js"), "utf8");
assert(hudJs.includes("hud-drawer-group"), "settings drawer groups");
assert(hudJs.includes("hud-demo-link"), "try demo mode drawer link");
assert(hudJs.includes("goalMilestoneAction"), "goal bar milestone scroll");
assert(hudJs.includes("pulseHudCombo"), "combo pulse on tap boost");
assert(hudJs.includes("refreshHud"), "live studio rating refresh");
assert(readFileSync(join(root, "gameplay-studio-rating.js"), "utf8").includes("refreshHud"), "rating refreshHud export");
assert(html.includes("restartAsDemo"), "restartAsDemo on hook");
assert(html.includes("seasonClaimed"), "season pass state");
assert(html.includes('id="main"></div>'), "clean #main shell");
assert(html.includes("BUILD_TAG"), "build tag constant");
assert(html.includes("whatsnew"), "what's new modal");

const rawCount = (html.match(/__raw/g) || []).length;
assert(rawCount <= 2, "single __raw redirect script", `found ${rawCount}`);

for (const f of ["strings.js", "logic.js", "aaa-upgrade.js", "gameplay-plus.js", "gameplay-ultra.js", "gameplay-endless.js", "gameplay-empire.js", "gameplay-studio.js", "gameplay-final.js", "gameplay-aaa.js", "gameplay-legend.js", "hud-premium.js", "ui-complete.js", "gameplay-studio-rating.js", "gameplay-polish.js", "v5-render-guard.js", "hook-bridge.js"]) {
  const r = spawnSync("node", ["--check", join(root, f)], { encoding: "utf8" });
  assert(r.status === 0, `syntax OK: ${f}`, r.stderr?.trim());
}

try {
  const { t, setLang, LANGS } = await import(`file://${join(root, "strings.js")}`);
  setLang("en");
  assert(typeof t("tab_produce") === "string" && t("tab_produce").length > 0, "strings.js t() en");
  assert(Object.keys(LANGS).length >= 6, "6+ languages");
} catch (e) {
  fail("strings.js import", e.message);
}

try {
  const manifest = JSON.parse(readFileSync(join(root, "manifest.json"), "utf8"));
  assert(manifest.name && manifest.start_url, "manifest.json valid");
} catch (e) {
  fail("manifest.json", e.message);
}

const prep = spawnSync("node", ["scripts/prepare-native.mjs"], { cwd: root, encoding: "utf8" });
assert(prep.status === 0, "prepare-native.mjs runs", prep.stderr?.trim() || prep.stdout?.trim());
assert(existsSync(join(root, "www/index.html")), "www/index.html created");
assert(existsSync(join(root, "www/aaa-upgrade.js")), "www/aaa-upgrade.js copied");
assert(existsSync(join(root, "www/gameplay-ultra.js")), "www/gameplay-ultra.js copied");
assert(existsSync(join(root, "www/gameplay-endless.js")), "www/gameplay-endless.js copied");
const dpkg = JSON.parse(readFileSync(join(root, "desktop/package.json"), "utf8"));
assert(dpkg.build?.extraResources?.[0]?.filter?.includes("gameplay-ultra.js"), "desktop bundles ultra");
assert(dpkg.build?.extraResources?.[0]?.filter?.includes("gameplay-endless.js"), "desktop bundles endless");
assert(dpkg.build?.extraResources?.[0]?.filter?.includes("gameplay-empire.js"), "desktop bundles empire");
assert(dpkg.build?.extraResources?.[0]?.filter?.includes("gameplay-studio.js"), "desktop bundles studio");
assert(dpkg.build?.extraResources?.[0]?.filter?.includes("gameplay-final.js"), "desktop bundles final");
assert(existsSync(join(root, "www/gameplay-empire.js")), "www/gameplay-empire.js copied");
assert(existsSync(join(root, "www/gameplay-studio.js")), "www/gameplay-studio.js copied");
assert(existsSync(join(root, "www/gameplay-final.js")), "www/gameplay-final.js copied");
assert(existsSync(join(root, "www/gameplay-aaa.js")), "www/gameplay-aaa.js copied");
assert(dpkg.build?.extraResources?.[0]?.filter?.includes("gameplay-aaa.js"), "desktop bundles aaa");
assert(existsSync(join(root, "www/gameplay-legend.js")), "www/gameplay-legend.js copied");
assert(dpkg.build?.extraResources?.[0]?.filter?.includes("gameplay-legend.js"), "desktop bundles legend");
assert(existsSync(join(root, "www/hud-premium.js")), "www/hud-premium.js copied");
assert(dpkg.build?.extraResources?.[0]?.filter?.includes("hud-premium.js"), "desktop bundles hud");
assert(existsSync(join(root, "www/ui-complete.js")), "www/ui-complete.js copied");
assert(dpkg.build?.extraResources?.[0]?.filter?.includes("ui-complete.js"), "desktop bundles ui-complete");
assert(existsSync(join(root, "www/gameplay-studio-rating.js")), "www/gameplay-studio-rating.js copied");
assert(dpkg.build?.extraResources?.[0]?.filter?.includes("gameplay-studio-rating.js"), "desktop bundles studio-rating");
assert(existsSync(join(root, "www/hook-bridge.js")), "www/hook-bridge.js copied");
assert(dpkg.build?.extraResources?.[0]?.filter?.includes("hook-bridge.js"), "desktop bundles hook-bridge");
assert(existsSync(join(root, "www/gameplay-polish.js")), "www/gameplay-polish.js copied");
assert(dpkg.build?.extraResources?.[0]?.filter?.includes("gameplay-polish.js"), "desktop bundles polish");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);