/**
 * V5 slim mode — skip gameplay expansion layers (DOM injection only).
 * Core game logic stays in index.html; HUD v3 owns the chrome.
 */
(function () {
  if (!document.documentElement.classList.contains("hud-v3-active")) return;

  const SKIP = [
    "__plusInstalled",
    "__ultraInstalled",
    "__endlessInstalled",
    "__empireInstalled",
    "__studioInstalled",
    "__finalInstalled",
    "__aaaLayerInstalled",
    "__legendInstalled",
    "__jwRatingInstalled",
    "__polishInstalled",
  ];

  function markSkipped() {
    const hook = window.__AST_HOOK__;
    if (!hook) return false;
    SKIP.forEach((k) => { hook[k] = true; });
    return true;
  }

  if (!markSkipped()) {
    const poll = setInterval(() => {
      if (markSkipped()) clearInterval(poll);
    }, 8);
    setTimeout(() => clearInterval(poll), 5000);
  }
})();