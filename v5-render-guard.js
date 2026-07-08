/**
 * AST v5 — strips legacy gameplay-layer DOM injections after render.
 * Loads after all gameplay-*.js hooks, before hook-bridge.
 */
(function () {
  const KILL =
    "#quick-bar,#daily-goals-panel,#rival-panel,#bid-panel,#market-dash," +
    "#jw-produce-rating,#empire-recruit-panel,.prod-stage,.pity-meter,.merch-panel," +
    ".scout-banner,.empire-recruit,.legend-glass,.legend-perks,.legend-ledger," +
    ".influence-panel,.template-bar,.morale-heat,.records-grid,.collection-bar," +
    ".trend-forecast,.stage-minigame,.polish-btn,.aaa-smart-cast-bar,.smart-cast-bar," +
    "#combo-meter,.template-bar,.morale-heat,.records-grid,.collection-bar";

  function stripLegacyInjections() {
    if (!document.documentElement.classList.contains("hud-v3-active")) return;
    document.querySelectorAll(KILL).forEach((el) => el.remove());
  }

  function install() {
    const hook = window.__AST_HOOK__;
    if (!hook || !hook.__polishInstalled || hook.__v5GuardInstalled) return false;
    hook.__v5GuardInstalled = true;
    const inner = hook.render;
    hook.render = function () {
      inner();
      stripLegacyInjections();
    };
    stripLegacyInjections();
    return true;
  }

  const poll = setInterval(() => {
    if (install()) clearInterval(poll);
  }, 40);
})();