/**
 * Rebinds global game functions to __AST_HOOK__ after expansion layers wrap them.
 * Without this, index.html calls base render/releaseProject/tick and all hooks are dead.
 */
(function () {
  const REQUIRED = [
    "__aaaInstalled",
    "__plusInstalled",
    "__ultraInstalled",
    "__endlessInstalled",
    "__empireInstalled",
    "__studioInstalled",
    "__finalInstalled",
    "__aaaLayerInstalled",
    "__legendInstalled",
    "__hudPremiumInstalled",
    "__uiCompleteInstalled",
    "__jwRatingInstalled",
  ];

  function ready(h) {
    if (!h) return false;
    return REQUIRED.every((k) => h[k]);
  }

  function rebind() {
    const h = window.__AST_HOOK__;
    if (!ready(h)) return setTimeout(rebind, 50);
    if (h.__globalsRebound) return;

    h.__globalsRebound = true;
    window.render = function () { return h.render(); };
    window.releaseProject = function (slot) { return h.releaseProject(slot); };
    window.tick = function (sec) { return h.tick(sec); };
    window.greenlight = function () { return h.greenlight.apply(h, arguments); };
    window.hire = function (role) { return h.hire(role); };
    window.expandStudio = function () { return h.expandStudio(); };
    if (h.pullStar) window.pullStar = function () { return h.pullStar.apply(h, arguments); };

    try { h.render(); } catch (e) { console.warn("hook-bridge render", e); }
  }

  rebind();
})();