/**
 * AST v5 — strips legacy gameplay-layer DOM injections after render.
 * Loads LAST (after hook-bridge) so it wraps the outermost render.
 */
(function () {
  const KILL =
    "#quick-bar,#daily-goals-panel,#rival-panel,#bid-panel,#market-dash," +
    "#jw-produce-rating,#empire-recruit-panel,.prod-stage,.pity-meter,.merch-panel," +
    ".scout-banner,.empire-recruit,.legend-glass,.legend-perks,.legend-ledger," +
    ".influence-panel,.template-bar,.morale-heat,.records-grid,.collection-bar," +
    ".trend-forecast,.stage-minigame,.polish-btn,.aaa-smart-cast-bar,.smart-cast-bar," +
    "#combo-meter,.ui-tab-hero,.ui-quest-chest,.ui-achieve-strip,.ui-prod-slots," +
    ".ui-dept-header,.ui-store-hero,.ui-store-shelf,.dynasty-badge,.eventbar," +
    ".aaa-produce-strip,.hero-card";

  function stripLegacyInjections() {
    if (!document.documentElement.classList.contains("hud-v3-active")) return;
    document.querySelectorAll(KILL).forEach((el) => el.remove());
    const main = document.getElementById("main");
    if (!main) return;
    [...main.children].forEach((el) => {
      if (!el.classList.contains("aaa-tab-page")) el.remove();
    });
  }

  function install() {
    const hook = window.__AST_HOOK__;
    if (!hook || hook.__v5GuardInstalled) return false;
    hook.__v5GuardInstalled = true;
    const inner = hook.render;
    hook.render = function () {
      inner();
      stripLegacyInjections();
      requestAnimationFrame(stripLegacyInjections);
      setTimeout(stripLegacyInjections, 0);
    };
    stripLegacyInjections();
    return true;
  }

  const poll = setInterval(() => {
    if (install()) clearInterval(poll);
  }, 20);
  setTimeout(() => clearInterval(poll), 8000);
})();