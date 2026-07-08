/**
 * V5 slim mode — skip gameplay expansion DOM injection; defer heavy layers until mid-game.
 * Core game logic stays in index.html; HUD v3 owns the chrome.
 */
(function () {
  if (!document.documentElement.classList.contains("hud-v3-active")) return;

  const ASSET_V = "99";
  const HEAVY_FLAGS = ["__finalInstalled", "__aaaLayerInstalled", "__legendInstalled"];
  const HEAVY_SCRIPTS = [
    "gameplay-final.js",
    "gameplay-aaa.js",
    "gameplay-legend.js",
  ];

  const DOM_SKIP = [
    "__plusInstalled",
    "__ultraInstalled",
    "__endlessInstalled",
    "__empireInstalled",
    "__studioInstalled",
    "__jwRatingInstalled",
    "__polishInstalled",
  ];

  let heavyLoaded = false;
  let heavyLoading = false;
  let heavyDeferred = false;
  let loaderEl = null;

  function hook() {
    return window.__AST_HOOK__;
  }

  function getState() {
    const h = hook();
    return h && h.getState ? h.getState() : null;
  }

  function heavyEligible(S) {
    if (!S) return false;
    return (S.releases || 0) >= 3 || (S.totalFansEver || 0) >= 50;
  }

  function markDomSkipped() {
    const h = hook();
    if (!h) return false;
    DOM_SKIP.forEach((k) => { h[k] = true; });
    return true;
  }

  function markHeavySkipped() {
    const h = hook();
    if (!h) return false;
    HEAVY_FLAGS.forEach((k) => { h[k] = true; });
    heavyDeferred = true;
    return true;
  }

  function clearHeavySkipped() {
    const h = hook();
    if (!h) return;
    HEAVY_FLAGS.forEach((k) => { h[k] = false; });
  }

  function ensureLoaderStyles() {
    if (document.getElementById("ast-heavy-loader-style")) return;
    const st = document.createElement("style");
    st.id = "ast-heavy-loader-style";
    st.textContent = [
      "#ast-heavy-loader{position:fixed;inset:0;z-index:100002;display:flex;align-items:center;justify-content:center;",
      "background:rgba(8,5,15,.72);backdrop-filter:blur(6px);opacity:0;pointer-events:none;transition:opacity .22s}",
      "#ast-heavy-loader.show{opacity:1;pointer-events:auto}",
      "#ast-heavy-loader .ast-heavy-loader-card{text-align:center;padding:20px 28px;border-radius:18px;",
      "background:linear-gradient(145deg,rgba(28,20,42,.96),rgba(16,11,26,.98));",
      "border:1px solid rgba(251,191,36,.35);box-shadow:0 16px 40px rgba(0,0,0,.45);max-width:min(92vw,320px)}",
      "#ast-heavy-loader .ast-heavy-loader-ic{font-size:28px;margin-bottom:8px}",
      "#ast-heavy-loader b{display:block;font:800 15px/1.3 system-ui,sans-serif;color:#ece6f4;margin-bottom:4px}",
      "#ast-heavy-loader small{display:block;font:600 12px/1.4 system-ui,sans-serif;color:#a89bbe}",
      "#ast-heavy-loader .ast-heavy-loader-bar{height:4px;border-radius:999px;background:rgba(255,255,255,.12);margin-top:12px;overflow:hidden}",
      "#ast-heavy-loader .ast-heavy-loader-bar i{display:block;height:100%;width:35%;border-radius:999px;",
      "background:linear-gradient(90deg,#ec4899,#fbbf24);animation:astHeavyLoad 1.1s ease-in-out infinite}",
      "@keyframes astHeavyLoad{0%{transform:translateX(-120%)}100%{transform:translateX(320%)}}",
    ].join("");
    document.head.appendChild(st);
  }

  function showLayerLoader() {
    ensureLoaderStyles();
    if (!loaderEl) {
      loaderEl = document.createElement("div");
      loaderEl.id = "ast-heavy-loader";
      loaderEl.setAttribute("role", "status");
      loaderEl.setAttribute("aria-live", "polite");
      loaderEl.innerHTML = [
        '<div class="ast-heavy-loader-card">',
        '<div class="ast-heavy-loader-ic" aria-hidden="true">✨</div>',
        "<b>Unlocking studio features</b>",
        "<small>Loading advanced gameplay layers…</small>",
        '<div class="ast-heavy-loader-bar"><i></i></div>',
        "</div>",
      ].join("");
      document.body.appendChild(loaderEl);
    }
    requestAnimationFrame(() => loaderEl.classList.add("show"));
  }

  function hideLayerLoader() {
    if (!loaderEl) return;
    loaderEl.classList.remove("show");
  }

  function triggerRebind() {
    const h = hook();
    if (h) h.__globalsRebound = false;
    if (typeof window.__AST_REBIND__ === "function") window.__AST_REBIND__();
  }

  function injectHeavyLayers(showIndicator) {
    if (heavyLoaded || heavyLoading) return;
    heavyLoading = true;
    if (showIndicator) showLayerLoader();
    clearHeavySkipped();

    let i = 0;
    function next() {
      if (i >= HEAVY_SCRIPTS.length) {
        heavyLoaded = true;
        heavyLoading = false;
        heavyDeferred = false;
        hideLayerLoader();
        const wait = setInterval(() => {
          const h = hook();
          if (!h) return;
          if (HEAVY_FLAGS.every((k) => h[k])) {
            clearInterval(wait);
            triggerRebind();
          }
        }, 40);
        setTimeout(() => clearInterval(wait), 8000);
        return;
      }
      const s = document.createElement("script");
      s.src = HEAVY_SCRIPTS[i] + "?v=" + ASSET_V;
      s.onload = () => { i += 1; next(); };
      s.onerror = () => { i += 1; next(); };
      document.head.appendChild(s);
    }
    next();
  }

  function boot() {
    if (!markDomSkipped()) return;
    const S = getState();
    if (heavyEligible(S)) {
      injectHeavyLayers(false);
      return;
    }
    markHeavySkipped();
    const poll = setInterval(() => {
      const st = getState();
      if (!heavyDeferred || heavyLoaded || heavyLoading) return;
      if (heavyEligible(st)) {
        clearInterval(poll);
        injectHeavyLayers(true);
      }
    }, 800);
    setTimeout(() => clearInterval(poll), 7 * 24 * 60 * 60 * 1000);
  }

  if (!hook()) {
    const waitHook = setInterval(() => {
      if (hook()) {
        clearInterval(waitHook);
        boot();
      }
    }, 8);
    setTimeout(() => clearInterval(waitHook), 5000);
    return;
  }

  boot();
})();