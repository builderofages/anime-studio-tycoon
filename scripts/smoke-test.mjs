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
  "v5-idle-feel.js",
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
const logic = readFileSync(join(root, "logic.js"), "utf8");
const astCss = readFileSync(join(root, "ast-v5.css"), "utf8");
assert(!html.includes('${t("k_level"'), "no baked template literals in HTML");
assert(html.includes("window.__AST_HOOK__"), "AST hook exported");
assert(/src="aaa-upgrade\.js(\?v=\d+)?"/.test(html), "aaa-upgrade.js linked");
assert(/src="gameplay-plus\.js(\?v=\d+)?"/.test(html), "gameplay-plus.js linked");
assert(html.includes("pityCount"), "scout pity state");
assert(html.includes("merchLevel"), "merch line state");
assert(html.includes("autoGreenlight"), "auto-greenlight state");
assert(html.includes("marketShare"), "market share state");
assert(html.includes("applyAudioSettings"), "audio settings");
assert(html.includes("SYNTH_SFX_KEYS"), "synth sfx registry");
assert(html.includes("playSynth"), "web audio synth player");
assert(html.includes('"tab-switch"'), "tab-switch sfx profile");
assert(
  html.includes('play("greenlight")') ||
    html.includes('play(sfx||"click")') ||
    /celebrateGreenlightSlot[\s\S]*?play\(sfx/.test(html),
  "greenlight sfx wired"
);
assert(html.includes('play("premiere",{close:true})'), "premiere close sfx wired");
assert(/src="gameplay-ultra\.js(\?v=\d+)?"/.test(html), "gameplay-ultra.js linked");
assert(/src="gameplay-endless\.js(\?v=\d+)?"/.test(html), "gameplay-endless.js linked");
assert(logic.includes("endlessRisk"), "endless risk state");
assert(html.includes("endlessDiff"), "endless difficulty state");
assert(html.includes("projectStars"), "projectStars on hook");
assert(/src="gameplay-empire\.js(\?v=\d+)?"/.test(html), "gameplay-empire.js linked");
assert(logic.includes("namedStaff"), "named staff state");
assert(html.includes("pullStar"), "pullStar on hook");
assert(/src="gameplay-studio\.js(\?v=\d+)?"/.test(html), "gameplay-studio.js linked");
assert(logic.includes("sparks"), "spark currency state");
assert(html.includes("__AST_CONFIRM__"), "in-theme confirm hook");
assert(!/src="gameplay-final\.js(\?v=\d+)?"/.test(html), "gameplay-final.js deferred (not static)");
assert(readFileSync(join(root, "v5-slim-gate.js"), "utf8").includes("gameplay-final.js"), "v5 slim gate injects final");
assert(html.includes("influence"), "influence currency state");
assert(html.includes("streaming"), "streaming contracts state");
assert(html.includes("_finalReleaseMult"), "final release multiplier");
assert(!/src="gameplay-aaa\.js(\?v=\d+)?"/.test(html), "gameplay-aaa.js deferred (not static)");
assert(readFileSync(join(root, "v5-slim-gate.js"), "utf8").includes("gameplay-aaa.js"), "v5 slim gate injects aaa");
assert(html.includes("dynastyPoints"), "dynasty points state");
assert(html.includes("festivalWins"), "festival wins state");
assert(html.includes("_aaaReleaseMult"), "aaa release multiplier");
assert(html.includes("window.ACHIEVEMENTS"), "achievements exposed for aaa popups");
assert(!/src="gameplay-legend\.js(\?v=\d+)?"/.test(html), "gameplay-legend.js deferred (not static)");
assert(readFileSync(join(root, "v5-slim-gate.js"), "utf8").includes("gameplay-legend.js"), "v5 slim gate injects legend");
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
assert(readFileSync(join(root, "hook-bridge.js"), "utf8").includes("__AST_REBIND__"), "hook rebind export for deferred layers");
assert(readFileSync(join(root, "v5-slim-gate.js"), "utf8").includes("totalFansEver"), "heavy layer fan threshold");
assert(readFileSync(join(root, "v5-slim-gate.js"), "utf8").includes("releases"), "heavy layer release threshold");
assert(readFileSync(join(root, "v5-slim-gate.js"), "utf8").includes("ast-heavy-loader"), "mid-session layer loader");
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
assert(html.includes("build 111"), "build 111 tag");
assert(html.includes("Production Score"), "production score label");
assert(html.includes("Playable"), "build 111 playable tag");
assert(html.includes("safeBegin"), "boot safeBegin guard");
const vercelIgnore = readFileSync(join(root, ".vercelignore"), "utf8");
assert(vercelIgnore.includes("!audio/*.mp3"), "vercelignore allows audio mp3");
assert(vercelIgnore.includes("!audio/*.m4a"), "vercelignore allows audio m4a");
assert(vercelIgnore.includes("!audio/*.wav"), "vercelignore allows audio wav");
assert(existsSync(join(root, "audio/bgm.m4a")), "self-hosted bgm");
assert(existsSync(join(root, "audio/hire.wav")), "hire wav sfx");
assert(existsSync(join(root, "audio/first-greenlight.wav")), "first-greenlight wav sfx");
assert(html.includes("AUDIO_ASSETS"), "audio assets registry");
assert(html.includes("playDedicatedSfx"), "dedicated sfx playback");
assert(html.includes("playSfxFallback"), "hybrid sfx fallback chain");
for (const m of html.matchAll(/"(?:audio\/[^"]+\.(?:wav|mp3|m4a))"/g)) {
  assert(existsSync(join(root, m[0].slice(1, -1))), `audio asset on disk: ${m[0]}`);
}
assert(html.includes("audio/bgm.m4a"), "self-hosted bgm path in index");
assert(!/new Audio\([^)]*cloudfront/.test(html), "no cloudfront new Audio urls");
assert(existsSync(join(root, "og-share.jpg")), "og-share.jpg self-hosted share card");
assert(html.includes("og-share.jpg"), "og image uses self-hosted share card");
assert(html.includes("SHARE_OG_URL"), "share og url constant");
assert(existsSync(join(root, "robots.txt")), "robots.txt for crawlers");
assert(readFileSync(join(root, "robots.txt"), "utf8").includes("Disallow: /api/"), "robots blocks api");
assert(existsSync(join(root, "sitemap.xml")), "sitemap.xml for seo");
assert(readFileSync(join(root, "sitemap.xml"), "utf8").includes("<lastmod>"), "sitemap lastmod dates");
const vercelCfg = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8"));
assert(vercelCfg.rewrites?.some((r) => r.source === "/play" && r.destination === "/index.html"), "vercel /play rewrite to index");
assert(vercelCfg.rewrites?.some((r) => String(r.source).includes("/audio/")), "vercel audio rewrite");
assert(vercelCfg.headers?.some((h) => String(h.source).includes("/audio/")), "vercel audio cache headers");
assert(vercelCfg.headers?.some((h) => h.source === "/og-share.jpg"), "vercel og-share cache headers");
const catchAllIdx = vercelCfg.headers?.findIndex((h) => h.source === "/(.*)");
const ogShareIdx = vercelCfg.headers?.findIndex((h) => h.source === "/og-share.jpg");
assert(catchAllIdx >= 0 && ogShareIdx > catchAllIdx, "vercel og-share headers override catch-all");
assert(vercelCfg.redirects?.some((r) => r.source === "/" && r.destination === "/play"), "vercel root redirect to play");
assert(vercelCfg.redirects?.some((r) => r.source === "/play.html" && r.destination === "/play"), "vercel play.html redirect to play");
assert(html.includes("v5-idle-feel.js"), "idle feel script linked");
assert(html.includes("dynastyHeroHTML"), "dynasty hero on studio dashboard");
assert(html.includes("franchisePanelHTML"), "franchise list panel on studio tab");
assert(html.includes("chaosStudioToggleHTML"), "prominent chaos toggle on studio dashboard");
assert(html.includes("dynastyScore"), "dynasty score helper");
assert(html.includes("syncPeakDynasty"), "peak dynasty sync helper");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("dynastyPerkCoach"), "coach dynasty perk tip");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("rival-race-expanded"), "expanded rival race hud");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("rival-race-leaders"), "rival race top-3 leaders");
assert(html.includes("drainUnlockModalQueue"), "unlock modal queue drain");
assert(html.includes("tabAccessible"), "tab accessible guard on hook");
assert(html.includes("aaa-gl-carousel-stage"), "greenlight theater carousel stage");
assert(html.includes("registerFranchiseHit"), "franchise hit registration");
assert(html.includes("celebrateFirstFranchise"), "first franchise celebration");
assert(html.includes("sequelShowcaseEntries"), "sequel greenlight carousel entries");
assert(html.includes("aaa-gl-badge sequel"), "sequel badge on greenlight carousel");
assert(html.includes("aaa-stat-franchise"), "franchise counter on studio dashboard");
assert(html.includes("prem-franchise-suggest"), "premiere sequel suggest cta");
assert(html.includes("franchiseOpportunity"), "franchise opportunity state");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("franchiseOpportunityCoach"), "coach franchise sequel tip");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("Your hit deserves a sequel"), "coach sequel copy");
assert(html.includes("beforeinstallprompt"), "pwa beforeinstallprompt listener");
assert(html.includes("aaa-pwa-install-banner"), "pwa install banner markup");
assert(html.includes("maybeShowPwaInstallBanner"), "pwa install banner helper");
assert(html.includes("showReturnPlayerWelcomeToast"), "return player welcome toast");
assert(html.includes('id="return-hub"'), "return hub modal");
assert(html.includes("maybeShowReturnHub"), "return hub batch helper");
assert(html.includes("closeReturnHub"), "return hub close helper");
assert(html.includes("return-hub-close"), "return hub close action");
assert(html.includes("pendingUnlockTeasers"), "unlock teaser helper");
assert(html.includes("returnHubOpen"), "return hub open guard");
assert(html.includes('id="push-notify-stub"'), "push notify stub modal");
assert(html.includes("pushNotifyOptIn"), "push notify opt-in state");
assert(html.includes("initPwaInstall"), "pwa install init");
assert(html.includes("isMobilePlayDevice"), "mobile play device helper on hook");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("pwaHomeScreenCoach"), "coach add to home screen tip");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("Add to Home Screen"), "coach home screen copy");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("push-notify-show"), "drawer push notify button");
assert(html.includes("chaosDangerTier"), "chaos danger tier helper");
assert(html.includes("function spendYen("), "crisis spendYen guard in index");
assert(readFileSync(join(root, "gameplay-empire.js"), "utf8").includes("function crisisPay("), "empire crisisPay helper");
assert(readFileSync(join(root, "gameplay-empire.js"), "utf8").includes("__AST_EMPIRE_CRISIS__"), "empire crisis test export");
assert(readFileSync(join(root, "gameplay-empire.js"), "utf8").includes("fallback()"), "empire maybeChaos fallback escape hatch");
assert(html.includes("syncCrisisHudPulse"), "crisis hud pulse sync");
assert(html.includes("aaa-decision-danger"), "crisis danger meter markup");
assert(html.includes("aaa-stat-crisis"), "crises survived stat card");
assert(html.includes("aaa-calm-orb-hot"), "calm orb store highlight");
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
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("chaosDisasterCoach"), "coach chaos disaster warning");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("disaster looming"), "coach chaos over 50 tip");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("firstChaosSurvivalCoach"), "coach first chaos survival tip");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("crisisOpenCoach"), "coach active crisis tip");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("hud-chaos-crisis"), "chaos pill crisis pulse class");
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
assert(html.includes("checkoutConfigured"), "store payments checkout gate");
assert(html.includes("storePaymentsEnabled"), "store payments f2p url gate");
assert(html.includes('id="aaa-free-gems"'), "free gems section anchor");
assert(html.includes("aaa-redeem-promo-form"), "promo redeem form row");
assert(html.includes("aaa-redeem-license-form"), "gumroad license redeem form");
assert(html.includes("store-scroll-freegems"), "store scroll to free gems cta");
assert(html.includes("scrollStoreSection"), "store section scroll helper");
assert(html.includes("Enter a promo code"), "redeem empty code feedback");
assert(html.includes("async function redeemLicenseKey"), "gumroad license redeem helper");
assert(/function buyReal\([^)]*\)\{[\s\S]*?\}\s*\nasync function redeemLicenseKey/.test(html), "buyReal closed before redeemLicenseKey");
assert(html.includes("aaa-store-f2p-hero"), "f2p earn gems hero when payments off");
assert(html.includes("aaa-store-earn-path"), "f2p earn gems path list");
assert(html.includes("markGemSpent"), "gem spend tracking");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("firstGemSpendCoach"), "coach first gem spend tip");
assert(readFileSync(join(root, "iap.js"), "utf8").includes("window.AST_GRANT"), "iap grant bridge");
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
assert(html.includes("Build 111"), "what's new build 111");
assert(html.includes("Build 111 — Playable"), "what's new playable headline");
assert(html.includes("1286 tests"), "what's new test count bullet");
assert(html.includes("HUD grid"), "what's new mobile layout bullet");
assert(html.includes("repairLoadedState"), "what's new boot repair bullet");
assert(html.includes("Greenlight carousel"), "what's new produce bullet");
assert(existsSync(join(root, "launch/DEVICE_QA.md")), "device qa checklist doc");
assert(html.includes("tabUnlockPct"), "tab unlock pct helper");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("updateTabUnlockRings"), "tab unlock ring updater");
assert(!readFileSync(join(root, "hud-premium.js"), "utf8").includes("label.slice(0, 13)"), "coach cta no hard js truncation");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("hudDrawerEscWired"), "settings drawer escape close");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("trapDrawerTabKey"), "settings drawer focus trap helper");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("drawerFocusables"), "settings drawer focusable query");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("wireTabKeyboardNav"), "dock tab keyboard nav");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("syncTabRovingFocus"), "dock tab roving tabindex");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("tabAriaBase"), "tab badge aria on tab button");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("tab.setAttribute(\"aria-label\""), "tab aria-label updates for badges");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("notifications pending"), "mail button pending aria");
const hudCss = readFileSync(join(root, "hud-premium.css"), "utf8");
assert(/\.hud-drawer\s*\{[^}]*z-index:\s*250/.test(hudCss), "settings drawer z-index 250");
assert(hudCss.includes("min-height: 44px !important") && hudCss.includes("html.hud-v3-active .tab"), "dock tabs 44px min height");
assert(hudCss.includes("--ui-muted: #9d96ad"), "hud muted contrast bump");
assert(hudCss.includes("auto auto auto auto 1fr"), "hud grid main row gets 1fr");
assert(astCss.includes("gt-tutorial-active #pathway-rail"), "tutorial hides duplicate coach rail");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("tab-unlock-ring-on"), "tab unlock ring css class");
assert(html.includes("redeemedCodes"), "promo code one-time schema");
assert(html.includes("WebApplication"), "what's new seo bullet");
assert(existsSync(join(root, "play.html")), "play.html redirect file");
const playHtml = readFileSync(join(root, "play.html"), "utf8");
assert(playHtml.includes("og-share.jpg"), "play.html og image for share crawlers");
assert(playHtml.includes('property="og:url"'), "play.html og url meta");
assert(html.includes('rel="canonical"'), "canonical link tag");
assert(html.includes('href="/manifest.json"'), "manifest link root-absolute");
assert(html.includes('href="/icons/icon-512.png"'), "apple-touch-icon root-absolute");
assert(readFileSync(join(root, "privacy.html"), "utf8").includes('href="https://anime-studio-tycoon.vercel.app/privacy"'), "privacy canonical");
assert(readFileSync(join(root, "terms.html"), "utf8").includes('href="https://anime-studio-tycoon.vercel.app/terms"'), "terms canonical");
assert(html.includes('property="og:url"'), "og url meta");
assert(html.includes('property="og:image:type"'), "og image type meta");
assert(html.includes('property="og:locale"'), "og locale meta");
assert(html.includes("max-image-preview:large"), "robots max image preview");
assert(html.includes('type="application/ld+json"'), "json-ld schema");
assert(html.includes("Free Anime Idle Tycoon Game"), "og title for share cards");
assert(html.includes('id="btn-start-share"'), "start screen share button");
assert(html.includes("sharePlayInvite"), "start screen share invite helper");
assert(readFileSync(join(root, "manifest.json"), "utf8").includes("Anime Tycoon"), "manifest short_name");
assert(readFileSync(join(root, "package.json"), "utf8").includes('"test:sim"'), "test:sim npm script");
assert(html.includes("bindAudioGestureUnlock"), "ios audio gesture unlock");
assert(html.includes("primeHtml5Audio"), "ios html5 audio prime helper");
assert(html.includes("bindIosFormFocusScroll"), "ios input focus scroll helper");
assert(html.includes("-webkit-fill-available"), "ios viewport fill fallback");
assert(astCss.includes("100dvh"), "ios dynamic viewport height in ast-v5");
assert(astCss.includes("BUILD 108 — iOS Safari"), "build 108 ios safari css marker");
assert(html.includes("maybeShowReturnHub"), "return hub wired in boot flow");
assert(html.includes('featureUnlocked("studio")&&S.slots<MAX_SLOTS'), "GL expand studio gate");
assert(html.includes("Awards Night"), "what's new awards night");
assert(html.includes('id="studio-award"'), "studio awards overlay");
assert(html.includes("celebrateStudioAward"), "studio awards celebration helper");
assert(html.includes("queueStudioAwardModal"), "studio awards queue helper");
assert(html.includes("seasonPassProgressHTML"), "season pass progress on quests");
assert(html.includes("SEASON_TIERS"), "season pass tier data");
assert(html.includes("function claimableRewardCount("), "quests: claimableRewardCount helper");
assert(html.includes("function seasonPassPanelHTML("), "quests: inline season pass panel");
assert(html.includes("function claimSeasonTier("), "quests: season tier claim handler");
assert(html.includes("function questTemplate("), "quests: early+full quest template lookup");
assert(html.includes("[data-plus-goal],[data-rival-claim],[data-season]"), "quests: goal/rival/season click delegate");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("claimableRewardCount"), "quests: hud uses claimableRewardCount");
assert(readFileSync(join(root, "gameplay-plus.js"), "utf8").includes("hud-v3-active") && readFileSync(join(root, "gameplay-plus.js"), "utf8").includes("plusGoal"), "quests: plus skips hud-v3 goal clicks");
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
assert(existsSync(join(root, "scripts/playtest-audit.mjs")), "playtest audit script");
assert(existsSync(join(root, "scripts/playtest-sim.mjs")), "playtest sim script");
const playSimSrc = readFileSync(join(root, "scripts/playtest-sim.mjs"), "utf8");
assert(playSimSrc.includes("IAP_FETCH_MOCK"), "playtest sim iap fetch mock coverage");
assert(playSimSrc.includes("redeemPurchaseToken"), "playtest sim redeemPurchaseToken");
assert(playSimSrc.includes("redeemLicenseKey"), "playtest sim redeemLicenseKey");
assert(playSimSrc.includes("createGrantFetchMock"), "playtest sim grant fetch mock helper");
assert(playSimSrc.includes("MODAL_STORM_RUNNER"), "playtest sim modal storm chain");
assert(playSimSrc.includes("_marketUnlockQueued"), "playtest sim market unlock queue");
assert(playSimSrc.includes("_researchUnlockQueued"), "playtest sim research unlock queue");
assert(playSimSrc.includes("_chaosUnlockQueued"), "playtest sim chaos unlock queue");
assert(playSimSrc.includes("items_pack"), "playtest sim items_pack grant");
assert(playSimSrc.includes("runReadGrantSimulation"), "playtest sim readGrant dev path");
assert(playSimSrc.includes("buildModalStormSandbox"), "playtest sim modal storm dom mock");
assert(playSimSrc.includes("runEmpireCrisisSimulation"), "playtest sim empire crisis guards");
assert(html.includes('addEntitlement("items_pack")'), "items_pack entitlement idempotent");
assert(html.includes("devgrants"), "readGrant devgrants escape hatch");
assert(html.includes("first-greenlight"), "first greenlight synth sfx profile");
assert(html.includes("celebrateGreenlightSlot"), "greenlight slot celebration burst");
assert(html.includes("unlock-open"), "unlock modal open sfx profile");
assert(html.includes("milestone-collect"), "share milestone collect sfx profile");
assert(astCss.includes("BUILD 108"), "build 108 css marker");
assert(astCss.includes("start-share-link"), "start share link css");
assert(astCss.includes("aaa-dynasty-hero"), "dynasty hero css");
assert(astCss.includes("aaa-franchise-panel"), "franchise panel css");
assert(astCss.includes("aaa-chaos-studio-card"), "chaos studio card css");
assert(astCss.includes("rival-race-expanded"), "rival race expanded css");
assert(astCss.includes("produce/GL polish"), "build 97 produce/gl css marker");
assert(astCss.includes("aaa-hero-block::after"), "hero card vignette css");
assert(astCss.includes("aaa-gl-carousel-stage .aaa-gl-carousel::after"), "gl seat silhouette css");
assert(astCss.includes("#goal .bar::before"), "goal fan milestone ticks css");
assert(astCss.includes("touch-action"), "touch-action anti-zoom on ctas");
assert(astCss.includes("-webkit-overflow-scrolling"), "carousel momentum scroll css");
assert(astCss.includes("aaa-return-hub-overlay"), "return hub safe-area overlay css");
assert(astCss.includes("prefers-reduced-motion"), "reduced motion support in ast-v5");
assert(astCss.includes("aaa-gl-carousel-stage"), "theater carousel stage css");
assert(astCss.includes("aaa-franchise-suggest"), "franchise suggest banner css");
assert(astCss.includes("aaa-pwa-install-banner"), "pwa install banner css");
assert(astCss.includes("aaa-push-coming-soon"), "push notify coming soon css");
assert(astCss.includes("aaa-crisis-decision-card"), "crisis decision modal css");
assert(astCss.includes("aaa-decision-danger--critical"), "danger meter color tiers");
assert(astCss.includes("hud-chaos-crisis"), "chaos crisis pulse css");
assert(astCss.includes("aaa-calm-orb-hot"), "calm orb highlight css");
assert(astCss.includes("aaa-studio-award-modal"), "studio awards modal css");
assert(astCss.includes("aaa-season-progress"), "season pass progress css");
assert(astCss.includes("aaa-festival-decision-modal"), "festival decision modal css");
assert(astCss.includes("aaa-dynasty-panel"), "dynasty panel css");
assert(astCss.includes("hud-festival-badge"), "festival hud badge css");
assert(html.includes("festivalInvitePending"), "festival invite pending helper");
assert(html.includes("dynastyStudioHTML"), "dynasty studio section");
assert(html.includes("festivalCircuitHTML"), "festival circuit dashboard");
assert(html.includes("celebrateFirstFestivalWin"), "first festival win celebration");
assert(html.includes('id="festival-win"'), "festival win overlay");
assert(html.includes("firstFestivalWinSeen"), "first festival win state");
assert(html.includes("aaa-festival-stakes"), "festival stakes markup");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("festivalInviteCoach"), "coach festival invite");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("hud-festival-badge"), "hud festival badge");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("festival-decision"), "coach festival decision action");
assert(html.includes("openFestivalDecisionModal"), "open festival decision modal helper");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("openFestivalDecisionModal"), "coach opens festival modal");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("nextUnlockPreviewCoach"), "coach next unlock preview");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("pulseActiveTab"), "tab switch haptic pulse");
assert(astCss.includes("tab-switch-bump"), "tab switch bump css");
assert(astCss.includes("coach-next-unlock"), "coach next unlock css");
assert(astCss.includes("aaa-decision-btn"), "decision button touch target css");
assert(readFileSync(join(root, "gameplay-legend.js"), "utf8").includes("celebrateFirstFestivalWin"), "legend first festival win hook");
assert(astCss.includes("aaa-offline-modal"), "offline modal css");
assert(astCss.includes("aaa-return-hub-modal"), "return hub modal css");
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
assert(astLines < 4500, "ast-v5.css under 4500 lines", `${astLines} lines`);
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
assert(logic.includes("1 more premiere to unlock Stars"), "locked stars tab progress copy");
assert(html.includes("starsPityHTML"), "stars pity hero helper");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("Stars unlocked"), "coach stars unlock tip");
assert(html.includes('id="studio-unlock"'), "studio unlock modal");
assert(html.includes("studioUnlockProgress"), "studio unlock progress helper");
assert(logic.includes("Premiere 1 anime to unlock Studio"), "locked studio tab progress copy");
assert(html.includes("queueStudioUnlockModal"), "studio unlock modal queue");
assert(html.includes("celebrateFirstExpand"), "first slot expansion celebration");
assert(html.includes("aaa-studio-expand-card"), "studio expansion featured card");
assert(html.includes("aaa-studio-expand-afford"), "studio expansion afford glow");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes('type: "studio-expand"'), "coach studio expansion tip");
assert(astCss.includes("aaa-studio-unlock-modal"), "studio unlock modal css");
assert(astCss.includes("aaa-studio-expand-afford"), "studio expansion afford css");
assert(html.includes('id="research-unlock"'), "research unlock modal");
assert(html.includes("researchUnlockProgress"), "research unlock progress helper");
assert(logic.includes("1 more fan to unlock Research"), "locked research tab progress copy");
assert(html.includes("queueResearchUnlockModal"), "research unlock modal queue");
assert(html.includes("celebrateFirstResearch"), "first research celebration");
assert(html.includes("aaa-research-trend-banner"), "research trending banner");
assert(html.includes("aaa-mastery-trend"), "trending mastery card highlight");
assert(html.includes("aaa-mastery-genre-ic"), "mastery genre icons");
assert(html.includes("researchCost"), "research cost helper on hook");
assert(html.includes("function updateMarketLive"), "market tab live afford refresh");
assert(html.includes("function updateResearchLive"), "research tab live afford + trend refresh");
assert(html.includes("function accessibleTabOrder"), "early dock accessible tab order");
assert(html.includes("GENRES.includes(genre)"), "research genre guard");
assert(html.includes("i>=CAMPAIGNS.length"), "campaign index bounds guard");
assert(html.includes("accessibleTabOrder,"), "accessibleTabOrder on hook");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("refreshDockChrome"), "dock badge live refresh on tick");
assert(readFileSync(join(root, "gameplay-plus.js"), "utf8").includes("patchMerchLive"), "merch afford live refresh on market tab");
assert(logic.includes("export function tabInDockFor"), "tabInDockFor in logic.js");
assert(readFileSync(join(root, "hud-premium.js"), "utf8").includes("Research ${trend}"), "coach trending research tip");
assert(astCss.includes("aaa-research-unlock-modal"), "research unlock modal css");
assert(astCss.includes("aaa-mastery-trend"), "mastery trend css");
assert(html.includes("hireCost,"), "hireCost on hook for tab badges");
assert(html.includes("estimatePremiere"), "premiere bonus estimator");
assert(html.includes("_premiereQueue"), "premiere modal queue for multi-slot releases");
assert(html.includes("rivalGoalFromStart"), "rival goal repair on corrupt save");
assert(html.includes("if(OFFLINE||unlockModalPending()){ _studioAwardQueued") || html.includes("if(OFFLINE||unlockModalPending()||_premiereWillShow){ _studioAwardQueued"), "studio award deferred during offline sim or pending premiere");
assert(html.includes("function bootBatchModalOpen("), "boot batch modal gate for offline/daily/whatsnew/howto");
assert(html.includes("bootBatchModalOpen()"), "unlockModalPending includes boot batch overlays");
assert(html.includes("bootBatchModalOpen()") && html.includes("celebrationOverlayOpen()") && html.match(/function drainUnlockModalQueue[\s\S]*?return false;/), "drainUnlockModalQueue blocks boot batch and celebrations");
assert(/btn-offclose.*drainUnlockModalQueue/s.test(html), "offline collect drains unlock modal queue");
assert(html.includes('data-act="daily-close"') && html.includes("daily-close") && html.includes("drainUnlockModalQueue"), "daily close drains unlock modal queue");
assert(html.includes("mergeLoadedSave") && logic.includes("DEFAULT_WEEK_PROG"), "weekProg restored on load");
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

/** Agent fixes markers — boot guards, corrupt-save repair, grant idempotency, greenlight nav. */
assert(html.includes("function repairLoadedState("), "agent fix: repairLoadedState wrapper");
assert(
  html.includes("repairLoadedState();") && html.includes("mergeLoadedSave"),
  "agent fix: repairLoadedState on load merge"
);
assert(html.includes("repairLoadedStateFor"), "agent fix: repairLoadedStateFor imported");
assert(logic.includes("export const VALID_TABS"), "agent fix: VALID_TABS in logic.js");
assert(logic.includes("export function repairLoadedStateFor"), "agent fix: repairLoadedStateFor exported");
assert(logic.includes("S.projects = S.projects.slice(0, S.slots)"), "agent fix: repairLoadedState clamps slots");
assert(logic.includes('if (!validTabs.has(S.tab)) S.tab = "produce"'), "agent fix: repairLoadedState resets tab");
assert(logic.includes("for (const r of roleKeys)"), "agent fix: repairLoadedState sanitizes staff");
assert(logic.includes("export function safeSaveNum"), "agent1: safeSaveNum exported");
assert(logic.includes("export function sanitizeSaveNumericsFor"), "agent1: sanitizeSaveNumericsFor exported");
assert(logic.includes("S.fans = safeSaveNum(S.fans"), "agent1: repair sanitizes NaN fans");
assert(logic.includes("Array.isArray(S)) return fresh()"), "agent1: repair rejects array saves");
assert(logic.includes("S.milestonesClaimed = Array.isArray(S.milestonesClaimed)"), "agent1: repair milestonesClaimed array");
assert(logic.includes("sanitizeSaveNumericsFor(S, fresh)"), "agent1: mergeLoadedSave sanitizes numerics");
assert(html.includes("!String(raw).trim()"), "agent1: load rejects blank localStorage save");
assert(html.includes("repairLoadedState(); begin()"), "agent1: safeBegin repairs before begin");
assert(logic.includes("export function repairRivalGoalFor"), "agent fix: repairRivalGoalFor exported");
assert(logic.includes("export function starsUnlockProgressFor"), "agent fix: starsUnlockProgressFor exported");
assert(logic.includes("export function tabLockedFor"), "agent fix: tabLockedFor exported");
assert(logic.includes("export function masteryResearchCostFor"), "agent fix: masteryResearchCostFor exported");
assert(html.includes("repairRivalGoalFor(S, studioValue())"), "agent fix: rival goal repair uses logic");
assert(html.includes("function safeBegin("), "agent fix: safeBegin wrapper");
assert(html.includes('console.error("boot failed"'), "agent fix: safeBegin logs boot failure");
assert(
  html.includes("localStorage.removeItem(SAVE_KEY)") && html.includes("function safeBegin("),
  "agent fix: safeBegin clears corrupt save"
);
assert(html.includes("function showStartScreen("), "agent fix: showStartScreen helper");
assert(
  html.includes("showStartScreen();") && html.includes("function safeBegin("),
  "agent fix: safeBegin falls back to start screen"
);
assert(html.includes("if(loaded) safeBegin()"), "agent fix: returning player safeBegin path");
assert(html.includes("else showStartScreen()"), "agent fix: new player start screen path");
assert(html.includes('console.warn("boot load failed"'), "agent fix: boot load catch warns");
assert(html.includes('throw new Error("invalid save")'), "agent fix: load rejects invalid save");
assert(html.includes('console.warn("load failed"'), "agent fix: load failure warns");
assert(html.includes('console.error("render failed"'), "agent fix: render failure recovery");
assert(html.includes("function openGreenlightView("), "agent fix: openGreenlightView defined");
assert(html.includes("openGreenlightView,"), "agent fix: openGreenlightView on hook");
assert(
  /function openGreenlightView\([\s\S]*?S\._produceSlotManual=true/.test(html),
  "agent fix: openGreenlightView manual slot"
);
assert(/function openGreenlightView\([\s\S]*?_glMode=true/.test(html), "agent fix: openGreenlightView gl mode");
assert(html.includes("preferredEmptySlot,"), "agent fix: preferredEmptySlot on hook");
assert(html.includes("greenlightBack:"), "agent fix: greenlightBack on hook");
assert(hudJs.includes("hook.openGreenlightView"), "agent fix: coach uses openGreenlightView");
assert(hudJs.includes("produce-slot-empty"), "agent fix: coach produce-slot-empty action");
assert(html.includes("function resolveGreenlightSlot("), "agent4: resolveGreenlightSlot helper");
assert(html.includes("function greenlightSlotFromClick("), "agent4: greenlightSlotFromClick helper");
assert(html.includes("openGreenlightView(greenlightSlotFromClick(t))"), "agent4: greenlight-view uses openGreenlightView");
assert(html.includes('data-act="greenlight-view" data-slot-ix'), "agent4: empty slot tap-to-greenlight attrs");
assert(
  /produce-slot-tab[\s\S]{0,400}openGreenlightView/.test(html),
  "agent4: empty produce tab opens greenlight"
);
assert(
  /celebrateGreenlightSlot[\s\S]*?play\(sfx/.test(html),
  "agent4: greenlight slot burst sfx sync"
);
assert(astCss.includes("BUILD 108 agent4"), "agent4: produce greenlight css marker");
assert(logic.includes("redeemedGrants: []"), "agent fix: logic freshState redeemedGrants");
assert(logic.includes("redeemedLicenses: []"), "agent fix: logic freshState redeemedLicenses");
assert(logic.includes("S.redeemedGrants = Array.isArray(d.redeemedGrants)"), "agent fix: mergeLoadedSave redeemedGrants");
assert(logic.includes("S.redeemedLicenses = Array.isArray(d.redeemedLicenses)"), "agent fix: mergeLoadedSave redeemedLicenses");
assert(html.includes("function grantWasRedeemed("), "agent fix: grantWasRedeemed helper");
assert(html.includes("function rememberGrantId("), "agent fix: rememberGrantId helper");
assert(html.includes("if(grantWasRedeemed(g.gid)) return false"), "agent fix: redeemPurchaseToken idempotency");
assert(
  /if\(g\.gid\)\{[\s\S]*?rememberGrantId\(g\.gid\);[\s\S]*?\}[\s\S]*?grantEntitlement/.test(html),
  "agent fix: rememberGrantId before grantEntitlement (gid in save)"
);
assert(html.includes("redeemedCodes:S.redeemedCodes"), "agent fix: prestige keeps redeemedCodes");
assert(html.includes("S.redeemedCodes=keep.redeemedCodes"), "agent fix: prestige restores redeemedCodes");
assert(html.includes("S.redeemedLicenses.push(lk);\n    save();"), "agent fix: license redeem persists redeemedLicenses");
assert(html.includes("function clearGrantParams("), "agent fix: clearGrantParams helper");
assert(html.includes("S.redeemedGrants=keep.redeemedGrants"), "agent fix: prestige keeps redeemedGrants");
assert(html.includes("S.redeemedLicenses=keep.redeemedLicenses"), "agent fix: prestige keeps redeemedLicenses");
assert(html.includes("redeemedGrants:S.redeemedGrants"), "agent fix: prestige snapshot redeemedGrants");
assert(html.includes("S.redeemedLicenses.includes(lk)"), "agent fix: license one-time redeem guard");
assert(html.includes("function ensureHudRival("), "agent fix: ensureHudRival hook");
assert(
  logic.includes("S.rivalGoal <= (S.rivalStartVal || 0)") && html.includes("repairRivalGoalFor(S, studioValue())"),
  "agent fix: rival goal corrupt-save repair"
);
assert(astCss.includes("safeBegin boot guard"), "agent fix: build 107 css safeBegin marker");
assert(html.includes("function ensurePlayable("), "agent fix: ensurePlayable stuck-save helper");
assert(html.includes("ensurePlayable();") && html.includes("function renderBody("), "agent fix: ensurePlayable in render path");
assert(html.includes("function redeemPurchaseToken("), "agent fix: signed purchase token redeem");
assert(html.includes("window.AST_GRANT = grantEntitlement"), "agent fix: native IAP grant bridge");

/** BUILD 108 — grant API security markers (_mint.js, redeem.js, _jwt.js). */
const grantMintSrc = readFileSync(join(root, "api/grant/_mint.js"), "utf8");
const grantRedeemSrc = readFileSync(join(root, "api/grant/redeem.js"), "utf8");
const grantJwtSrc = readFileSync(join(root, "api/grant/_jwt.js"), "utf8");
const grantSecSrc = readFileSync(join(root, "api/grant/_grant-security.js"), "utf8");
assert(grantMintSrc.includes("stableGrantId"), "grant security: stableGrantId");
assert(grantMintSrc.includes("adminStableGrantId"), "grant security: adminStableGrantId");
assert(grantMintSrc.includes("ALLOWED_GRANT_KINDS"), "grant security: kind whitelist import");
assert(grantMintSrc.includes("license_key required"), "grant security: license always required for gid");
assert(grantSecSrc.includes("ALLOWED_GRANT_KINDS"), "grant security: allowed kinds set");
assert(grantSecSrc.includes("normalizeGrantPt"), "grant security: pt query normalize");
assert(grantSecSrc.includes("splitGrantToken"), "grant security: strict token split");
assert(grantSecSrc.includes("sanitizeGrantPayload"), "grant security: payload sanitize");
assert(grantSecSrc.includes("MAX_GRANT_TOKEN_LEN"), "grant security: token length cap");
assert(grantJwtSrc.includes("timingSafeEqual"), "grant security: timing-safe HMAC verify");
assert(grantJwtSrc.includes("splitGrantToken"), "grant security: jwt uses strict token split");
assert(grantRedeemSrc.includes("normalizeGrantPt"), "grant security: redeem normalizes pt");
assert(grantRedeemSrc.includes("sanitizeGrantPayload"), "grant security: redeem sanitizes payload");
assert(grantRedeemSrc.includes("pt required"), "grant security: redeem missing pt error");
assert(grantRedeemSrc.includes("invalid grant payload"), "grant security: redeem rejects bad payload");

/** Build 108 integration review — cross-module render/tab/crisis wiring */
assert(
  html.includes("integration: leaving produce clears greenlight view"),
  "integration: setTab clears _glMode when leaving produce"
);
assert(
  !/function render\(\)\{\s*_tabsDockSig="";/.test(html),
  "integration: render does not invalidate tabs dock every pass"
);
assert(
  html.includes("integration: tabs dock signature cache"),
  "integration: tabs dock signature cache marker"
);
assert(
  hudJs.includes("integration: guided coach tab switch uses full hook.render"),
  "integration: guided coach uses hook.render not _renderMain"
);
assert(
  readFileSync(join(root, "gameplay-empire.js"), "utf8").includes("empireClickWired"),
  "integration: empire click delegation guarded"
);
assert(
  readFileSync(join(root, "gameplay-empire.js"), "utf8").includes("integration: empire poll timeout"),
  "integration: empire install poll timeout"
);
assert(astCss.includes("BUILD 108 integration"), "integration: build 108 css marker");

/** Build 108 agent11 — franchise sequel CTA + dynasty perk buy audit. */
assert(html.includes("function buyDynastyPerk("), "b108a11: buyDynastyPerk in core");
assert(html.includes("buyDynastyPerk,"), "b108a11: buyDynastyPerk on hook");
assert(html.includes("[data-legend-perk]"), "b108a11: dynasty perk click delegation");
assert(html.includes('if(t.dataset.legendPerk) return buyDynastyPerk(t.dataset.legendPerk)'), "b108a11: dynasty perk buy handler");
assert(
  /if\(t\.dataset\.act==="franchise-sequel-focus"\|\|t\.dataset\.act==="sequel-from-premiere"\)[\s\S]*?if\(t\.dataset\.seq!=null\)/.test(html),
  "b108a11: sequel focus CTA before data-seq makeSequel"
);
assert(html.includes("if(firstEmptySlot()<0)") && html.includes("function makeSequel("), "b108a11: makeSequel slot guard");
assert(html.includes("sequelGreenlightInfo()") && html.includes("function makeSequel("), "b108a11: makeSequel yen afford via sequelGreenlightInfo");
assert(html.includes("!afford||empties<=0"), "b108a11: sequel confirm disabled when slots full");
assert(html.includes("const canBuy=!maxed&&avail>=cost"), "b108a11: dynasty perk afford gate on buttons");
assert(
  readFileSync(join(root, "gameplay-legend.js"), "utf8").includes('typeof h.buyDynastyPerk === "function"'),
  "b108a11: legend layer delegates perk buy to hook"
);

/** Build 108 agent14 — modal queue, IAP guards, coach routing, produce UX, iOS CSS, logic exports. */
const iapJs = readFileSync(join(root, "iap.js"), "utf8");
assert(html.includes("function flushPostPremiereQueue("), "b108a14: flushPostPremiereQueue defined");
assert(html.includes("flushPostPremiereQueue,"), "b108a14: flushPostPremiereQueue on hook");
assert(html.includes("function celebrationOverlayOpen("), "b108a14: celebrationOverlayOpen defined");
assert(html.includes("let _chaosUnlockQueued=false"), "b108a14: chaos unlock queue flag");
assert(html.includes("let _marketUnlockQueued=false"), "b108a14: market unlock queue flag");
assert(html.includes("_festivalWinQueued"), "b108a14: festival win queue flag");
assert(html.includes("function queueChaosUnlockModal("), "b108a14: queueChaosUnlockModal");
assert(html.includes("function queueMarketUnlockModal("), "b108a14: queueMarketUnlockModal");
assert(html.includes("function closeChaosUnlockModal("), "b108a14: closeChaosUnlockModal");
assert(html.includes("function closeMarketUnlockModal("), "b108a14: closeMarketUnlockModal");
assert(
  /function drainUnlockModalQueue\(\)[\s\S]*?_chaosUnlockQueued[\s\S]*?_festivalWinQueued/.test(html),
  "b108a14: drainUnlockModalQueue chaos then festival order"
);
assert(iapJs.includes("window.IAPBuy"), "b108a14: IAPBuy native bridge");
assert(iapJs.includes("window.IAPRestore"), "b108a14: IAPRestore native bridge");
assert(iapJs.includes("window.__IAP_READY"), "b108a14: IAP ready flag");
assert(iapJs.includes("VALIDATOR_URL"), "b108a14: IAP validator URL hook");
assert(iapJs.includes("ID2SKU"), "b108a14: IAP product id reverse map");
assert(html.includes("function addEntitlement("), "b108a14: addEntitlement idempotency helper");
assert(html.includes('kind==="bundle_mogul"'), "b108a14: grantEntitlement mogul bundle");
assert(html.includes('typeof window.IAPBuy==="function"'), "b108a14: store uses native IAPBuy when available");
assert(hudJs.includes("function runPathwayAction("), "b108a14: coach runPathwayAction");
assert(hudJs.includes("window.__AST_PATHWAY__"), "b108a14: coach pathway snapshot");
assert(hudJs.includes('pw.action.type === "produce-slot-focus"'), "b108a14: coach produce-slot-focus routing");
assert(hudJs.includes('pw.action.type === "tapboost"'), "b108a14: coach tapboost routing");
assert(hudJs.includes('pw.action.type === "gl-suggest-trend"'), "b108a14: coach gl-suggest-trend routing");
assert(hudJs.includes('pw.action.type === "franchise-sequel"'), "b108a14: coach franchise-sequel routing");
assert(hudJs.includes('pw.action.type === "chaos-enable"'), "b108a14: coach chaos-enable routing");
assert(hudJs.includes('pw.action.type === "dynasty-perks"'), "b108a14: coach dynasty-perks routing");
assert(hudJs.includes("navigateCoachTab"), "b108a14: coach navigateCoachTab helper");
assert(hudJs.includes('rail.classList.toggle("coach-guided"'), "b108a14: coach guided rail class");
assert(html.includes("function produceSlotReady("), "b108a14: produceSlotReady helper");
assert(html.includes("aaa-produce-multi-page"), "b108a14: multi-slot produce page class");
assert(html.includes("aaa-produce-slot-ready-pill"), "b108a14: produce ready premiere pill");
assert(html.includes("aaa-slot-tab-ready"), "b108a14: produce slot tab ready sparkle");
assert(html.includes("S._produceSlotManual"), "b108a14: manual produce slot focus flag");
assert(astCss.includes("aaa-produce-strip"), "b108a14: produce strip css");
assert(astCss.includes("aaa-produce-slot-ready-pill"), "b108a14: produce ready pill css");
assert(hudCss.includes("env(safe-area-inset-top"), "b108a14: ios safe-area top inset");
assert(hudCss.includes("env(safe-area-inset-bottom"), "b108a14: ios safe-area bottom inset");
assert(hudCss.includes("-webkit-text-size-adjust"), "b108a14: ios text size adjust");
assert(astCss.includes("BUILD 97 — Mobile tab dock + safe-area"), "b108a14: mobile dock safe-area marker");
assert(astCss.includes("coach-cta { min-height: 44px"), "b108a14: ios coach 44px touch target");
assert(logic.includes("export function featureUnlockedFor"), "b108a14: logic exports featureUnlockedFor");
assert(logic.includes("export function tabUnlockPctFor"), "b108a14: logic exports tabUnlockPctFor");
assert(logic.includes("export function firstEmptySlotFor"), "b108a14: logic exports firstEmptySlotFor");
assert(logic.includes("export const UNLOCK_THRESHOLDS"), "b108a14: logic exports UNLOCK_THRESHOLDS");
assert(logic.includes("export function makeUnlocks"), "b108a14: logic exports makeUnlocks");
assert(logic.includes("export function studioValueFor"), "b108a14: logic exports studioValueFor");
assert(astCss.includes("BUILD 108 — Legion"), "b108a14: legion css audit marker");

assert(html.includes("restartAsDemo"), "restartAsDemo on hook");
assert(html.includes("seasonClaimed"), "season pass state");
assert(html.includes('id="main"></div>'), "clean #main shell");
assert(html.includes("BUILD_TAG"), "build tag constant");
assert(html.includes("whatsnew"), "what's new modal");

const rawCount = (html.match(/__raw/g) || []).length;
assert(rawCount <= 2, "single __raw redirect script", `found ${rawCount}`);

for (const f of ["strings.js", "logic.js", "aaa-upgrade.js", "gameplay-plus.js", "gameplay-ultra.js", "gameplay-endless.js", "gameplay-empire.js", "gameplay-studio.js", "gameplay-final.js", "gameplay-aaa.js", "gameplay-legend.js", "hud-premium.js", "ui-complete.js", "gameplay-studio-rating.js", "gameplay-polish.js", "v5-render-guard.js", "v5-idle-feel.js", "hook-bridge.js"]) {
  const r = spawnSync("node", ["--check", join(root, f)], { encoding: "utf8" });
  assert(r.status === 0, `syntax OK: ${f}`, r.stderr?.trim());
}

try {
  const { t, tf, setLang, LANGS } = await import(`file://${join(root, "strings.js")}`);
  setLang("en");
  assert(typeof t("tab_produce") === "string" && t("tab_produce").length > 0, "strings.js t() en");
  assert(Object.keys(LANGS).length >= 8, "8 languages (en,es,pt,fr,de,ja,ko,zh)");
  const UI4_LANGS = ["en", "ja", "ko", "zh", "es", "pt"];
  const UI4_KEYS = [
    "coach_label", "coach_guided", "coach_welcome", "coach_hire_role", "coach_cta_next",
    "coach_toast_welcome", "tut_skip", "tut_step", "s_balance_kicker", "s_lead_f2p",
  ];
  for (const lang of UI4_LANGS) {
    setLang(lang);
    assert(LANGS[lang], `LANGS.${lang} exists`);
    for (const key of UI4_KEYS) {
      const v = t(key);
      assert(v && v !== key, `UI4 ${key} (${lang})`);
    }
    const welcome = tf("coach_welcome", { name: "X" });
    assert(!welcome.includes("{name}"), `coach_welcome interpolation (${lang})`);
    const step = tf("tut_step", { n: 2, total: 5 });
    assert(!step.includes("{n}") && !step.includes("{total}"), `tut_step interpolation (${lang})`);
    const hireRole = tf("coach_hire_role", { role: "Animator" });
    assert(!hireRole.includes("{role}"), `coach_hire_role interpolation (${lang})`);
  }
} catch (e) {
  fail("strings.js import", e.message);
}

try {
  const logicMod = await import(`file://${join(root, "logic.js")}`);
  const genres = ["Action", "Drama", "Comedy"];
  const fresh = logicMod.createFreshState(genres);
  assert(logicMod.meta?.game === "anime-studio-tycoon", "b108 runtime: logic meta.game");
  assert(logicMod.MAX_SLOTS === 4, "b108 runtime: MAX_SLOTS");
  assert(logicMod.UNLOCK_THRESHOLDS?.chaos?.min?.releases === 10, "b108 runtime: chaos unlock threshold");
  assert(
    logicMod.featureUnlockedFor("market", { fans: 50, releases: 0 }) === true,
    "b108 runtime: market unlocked at 50 fans"
  );
  assert(
    logicMod.featureUnlockedFor("market", { fans: 49, releases: 0 }) === false,
    "b108 runtime: market locked below 50 fans"
  );
  assert(logicMod.firstEmptySlotFor(3, [null, {}, null]) === 0, "b108 runtime: firstEmptySlotFor");
  assert(logicMod.expandCostFor({ slots: 1 }) === 15000, "b108 runtime: expandCostFor slot 2");
  assert(logicMod.passMultFor(true) === 1.5, "b108 runtime: passMultFor");
  assert(logicMod.castCapFor(true) === 4, "b108 runtime: castCapFor with pass");
  assert(logicMod.starRankLetterFor(5) === "S", "b108 runtime: starRankLetterFor");
  assert(logicMod.studioRankLetterFor(5) === "S+", "b108 runtime: studioRankLetterFor");
  assert(logicMod.contentRankIndexFor(120) >= 2, "b108 runtime: contentRankIndexFor");
  assert(logicMod.rivalGoalFromStart(1000, () => 0) > 1000, "b108 runtime: rivalGoalFromStart");
  assert(logicMod.tabUnlockPctFor("market", { fans: 25, releases: 0 }, null) === 50, "b108 runtime: tabUnlockPctFor");
  assert(
    logicMod.hireCostFor("director", 0, 0, { base: 1000, growth: 1.5 }) === 1000,
    "b108 runtime: hireCostFor base"
  );
  assert(typeof logicMod.makeUnlocks(() => fresh).studio?.test === "function", "b108 runtime: makeUnlocks registry");
  assert(logicMod.activeCountFor([{}, null, {}]) === 2, "b108 runtime: activeCountFor");
  assert(logicMod.fmtEta(0) === "Ready!", "b108 runtime: fmtEta ready");
} catch (e) {
  fail("logic.js import", e.message);
}

try {
  const manifest = JSON.parse(readFileSync(join(root, "manifest.json"), "utf8"));
  assert(manifest.name && manifest.start_url, "manifest.json valid");
  assert(manifest.start_url === "/play", "manifest start_url /play");
  assert(manifest.id === "/play", "manifest id /play");
  assert(manifest.theme_color === "#08050f", "manifest theme_color polish");
  assert(manifest.categories && manifest.categories.includes("games"), "manifest categories");
} catch (e) {
  fail("manifest.json", e.message);
}

const prep = spawnSync("node", ["scripts/prepare-native.mjs"], { cwd: root, encoding: "utf8" });
assert(prep.status === 0, "prepare-native.mjs runs", prep.stderr?.trim() || prep.stdout?.trim());
assert(existsSync(join(root, "www/index.html")), "www/index.html created");
const wwwIap = readFileSync(join(root, "www/iap.js"), "utf8");
assert(wwwIap.includes("https://anime-studio-tycoon.vercel.app/api/iap/validate"), "www/iap.js production VALIDATOR_URL");
assert(!existsSync(join(root, "www/design-overhaul.css")), "www/ has no stale design-overhaul.css");
assert(existsSync(join(root, "www/og-share.jpg")), "www/og-share.jpg copied for native");
assert(existsSync(join(root, "www/audio/bgm.m4a")), "www/audio/bgm.m4a copied for native");
assert(existsSync(join(root, "www/audio/hire.wav")), "www/audio/hire.wav copied for native");
assert(existsSync(join(root, "www/play.html")), "www/play.html copied for native");
assert(existsSync(join(root, "www/robots.txt")), "www/robots.txt copied for native");
assert(existsSync(join(root, "www/sitemap.xml")), "www/sitemap.xml copied for native");
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

const playtest = spawnSync("node", ["scripts/playtest-audit.mjs"], { cwd: root, encoding: "utf8" });
assert(playtest.status === 0, "playtest-audit.mjs passes", playtest.stderr?.trim() || playtest.stdout?.trim());

const playSim = spawnSync("node", ["scripts/playtest-sim.mjs"], { cwd: root, encoding: "utf8" });
assert(playSim.status === 0, "playtest-sim.mjs passes", playSim.stderr?.trim() || playSim.stdout?.trim());

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);