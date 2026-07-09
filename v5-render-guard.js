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

  let stripRaf = 0;
  let mainClean = true;

  function stripLegacyInjections() {
    if (!document.documentElement.classList.contains("hud-v3-active")) return;

    const nodes = document.querySelectorAll(KILL);
    if (nodes.length) nodes.forEach((el) => el.remove());

    const main = document.getElementById("main");
    if (!main) return;

    if (mainClean) {
      for (const el of main.children) {
        if (!el.classList.contains("aaa-tab-page")) {
          mainClean = false;
          break;
        }
      }
      if (mainClean) return;
    }

    let removed = false;
    [...main.children].forEach((el) => {
      if (!el.classList.contains("aaa-tab-page")) {
        el.remove();
        removed = true;
      }
    });
    mainClean = !removed;
  }

  function scheduleStrip() {
    if (stripRaf) return;
    stripRaf = requestAnimationFrame(() => {
      stripRaf = 0;
      stripLegacyInjections();
    });
  }

  function install() {
    const hook = window.__AST_HOOK__;
    if (!hook || hook.__v5GuardInstalled) return false;
    hook.__v5GuardInstalled = true;
    const inner = hook.render;
    hook.render = function () {
      mainClean = false;
      inner();
      stripLegacyInjections();
      scheduleStrip();
    };
    stripLegacyInjections();
    return true;
  }

  const poll = setInterval(() => {
    if (install()) clearInterval(poll);
  }, 20);
  setTimeout(() => clearInterval(poll), 8000);
})();