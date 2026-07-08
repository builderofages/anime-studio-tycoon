/**
 * BUILD 99 — idle/produce feel: poster idle sparkles, boost cooldown, coach gift pulse.
 */
(function () {
  if (!document.documentElement.classList.contains("hud-v3-active")) return;

  const BOOST_CD_MS = 420;
  const slotCd = new Map();
  let animFrame = 0;

  function hook() {
    return window.__AST_HOOK__;
  }

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function syncCoachGift(S) {
    const gift = document.getElementById("coach-gift");
    if (!gift || !S) return;
    const today = todayStr();
    const loginPending = S.loginLastClaimDate !== today && (S.loginClaimedCount || 0) < 31;
    const freeGems = S.freeGemsDate !== today;
    gift.classList.toggle("coach-gift-unclaimed", loginPending || freeGems);
  }

  function syncProducePanels(S) {
    if (!S || S.tab !== "produce") return;
    const now = Date.now();
    const comboLeft = 60000 - (now - (S.lastReleaseAt || 0));
    const comboActive = (S.combo || 0) >= 2 && comboLeft > 0;
    const comboPct = comboActive ? Math.max(0, Math.min(100, (comboLeft / 60000) * 100)) : 0;

    document.querySelectorAll(".aaa-show-panel").forEach((panel) => {
      const slot = +panel.dataset.slotIx;
      if (Number.isNaN(slot)) return;
      const poster = panel.querySelector(".aaa-poster[data-act='tapboost']");
      const playBtn = panel.querySelector(".aaa-play-btn");
      const cdEnd = slotCd.get(slot) || 0;
      const onCd = now < cdEnd;
      const cdFrac = onCd ? Math.max(0, Math.min(1, (cdEnd - now) / BOOST_CD_MS)) : 0;

      if (poster) {
        poster.classList.toggle("aaa-poster-idle", !onCd);
        poster.classList.toggle("aaa-poster-boosting", onCd);
      }
      if (playBtn) {
        playBtn.classList.toggle("aaa-play-btn-cooldown", onCd);
        playBtn.style.setProperty("--boost-cd-frac", String(cdFrac));
        playBtn.classList.toggle("aaa-play-btn-combo", comboActive);
        playBtn.style.setProperty("--combo-cd-pct", comboPct + "%");
      }
    });
  }

  function syncIdleFeel() {
    const h = hook();
    if (!h) return;
    const S = h.getState();
    syncCoachGift(S);
    syncProducePanels(S);
  }

  function markBoost(slot) {
    slotCd.set(slot, Date.now() + BOOST_CD_MS);
    requestCdLoop();
    syncIdleFeel();
  }

  function requestCdLoop() {
    if (animFrame) return;
    function tick() {
      syncIdleFeel();
      const now = Date.now();
      const anyCd = [...slotCd.values()].some((t) => now < t);
      if (anyCd) animFrame = requestAnimationFrame(tick);
      else animFrame = 0;
    }
    animFrame = requestAnimationFrame(tick);
  }

  function install() {
    const h = hook();
    if (!h || h.__v5IdleFeelInstalled) return false;
    h.__v5IdleFeelInstalled = true;

    if (typeof h.tapBoost === "function" && !h.__v5IdleTapHooked) {
      h.__v5IdleTapHooked = true;
      const origTap = h.tapBoost;
      h.tapBoost = function (slot) {
        markBoost(slot);
        return origTap.apply(this, arguments);
      };
    }

    const origRender = h.render;
    h.render = function () {
      origRender();
      syncIdleFeel();
    };

    syncIdleFeel();
    return true;
  }

  const poll = setInterval(() => {
    if (install()) clearInterval(poll);
  }, 60);
})();