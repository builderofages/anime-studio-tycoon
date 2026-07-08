/**
 * Anime Studio Tycoon — Studio Star Rating (JW-style park rating)
 * 5-star studio rating with pillar progress, content gates, rank-up ceremony.
 */
(function () {
  const TIERS = [
    { stars: 1, name: "Garage Studio", icon: "🎬", bonus: 0 },
    { stars: 2, name: "Indie Label", icon: "📽️", bonus: 0.03 },
    { stars: 3, name: "Rising Studio", icon: "⭐", bonus: 0.06 },
    { stars: 4, name: "TV Powerhouse", icon: "📺", bonus: 0.09 },
    { stars: 5, name: "Global Brand", icon: "🌏", bonus: 0.12 },
  ];

  const NEXT_REQ = [
    null,
    {
      pillars: [
        { id: "catalog", label: "Catalog", icon: "🎬", cur: (S) => S.releases || 0, need: 3 },
        { id: "reach", label: "Audience", icon: "👥", cur: (S) => S.fans || 0, need: 50 },
        { id: "team", label: "Team Size", icon: "👥", cur: (S) => staffSum(S), need: 2 },
      ],
      gems: 5,
      blurb: "Indie credibility — bigger projects trust your name.",
    },
    {
      pillars: [
        { id: "catalog", label: "Catalog", icon: "🎬", cur: (S) => S.releases || 0, need: 12 },
        { id: "reach", label: "Audience", icon: "👥", cur: (S) => S.fans || 0, need: 500 },
        { id: "talent", label: "Signed Talent", icon: "🌟", cur: (S) => (S.stars || []).length, need: 3 },
        { id: "hits", label: "Hit Shows (4★+)", icon: "⭐", cur: (S) => premiereStat(S, "fourPlus"), need: 2 },
      ],
      gems: 8,
      blurb: "TV networks are watching — OVA tier unlocks at 3★.",
    },
    {
      pillars: [
        { id: "catalog", label: "Catalog", icon: "🎬", cur: (S) => S.releases || 0, need: 30 },
        { id: "reach", label: "Audience", icon: "👥", cur: (S) => S.fans || 0, need: 2500 },
        { id: "talent", label: "Signed Talent", icon: "🌟", cur: (S) => (S.stars || []).length, need: 8 },
        { id: "master", label: "Masterpieces (5★)", icon: "👑", cur: (S) => premiereStat(S, "five"), need: 3 },
        { id: "lines", label: "Production Lines", icon: "🏭", cur: (S) => S.slots || 1, need: 2 },
      ],
      gems: 12,
      blurb: "Feature-film studios want meetings — 4★ gates blockbusters.",
    },
    {
      pillars: [
        { id: "catalog", label: "Catalog", icon: "🎬", cur: (S) => S.releases || 0, need: 75 },
        { id: "reach", label: "Audience", icon: "👥", cur: (S) => S.fans || 0, need: 12000 },
        { id: "share", label: "Market Share", icon: "📊", cur: (S) => S.marketShare || 0, need: 12 },
        { id: "master", label: "Masterpieces (5★)", icon: "👑", cur: (S) => premiereStat(S, "five"), need: 8 },
        { id: "lines", label: "Production Lines", icon: "🏭", cur: (S) => S.slots || 1, need: 3 },
      ],
      gems: 25,
      blurb: "Maximum studio rating — mythic franchises & empire perks unlocked.",
    },
  ];

  const UNLOCK_BLURBS = [
    "",
    "Short Film · Web Series",
    "TV Series tier",
    "OVA tier",
    "Feature Film tier",
    "Blockbuster & mythic tiers",
  ];

  function staffSum(S) {
    const st = S.staff || {};
    return (st.animator || 0) + (st.writer || 0) + (st.director || 0) + (st.voice || 0) + (st.producer || 0);
  }

  function premiereStat(S, k) {
    const ps = S.premiereStats || {};
    if (ps[k] != null) return ps[k];
    const hf = S.hallOfFame || [];
    if (k === "five") return hf.filter((h) => h.stars >= 5).length;
    if (k === "fourPlus") return hf.filter((h) => h.stars >= 4).length;
    return 0;
  }

  function initState(S) {
    S.studioStars = Math.max(1, Math.min(5, S.studioStars || 1));
    S.studioStarBest = Math.max(S.studioStars, S.studioStarBest || S.studioStars);
    S.premiereStats = S.premiereStats || { fourPlus: premiereStat(S, "fourPlus"), five: premiereStat(S, "five") };
    S.studioStarPerks = S.studioStarPerks || {};
  }

  function tierInfo(stars) {
    return TIERS[Math.max(0, Math.min(5, stars)) - 1] || TIERS[0];
  }

  function pillarProgress(S, req) {
    if (!req) return { pct: 100, pillars: [], ready: false };
    const pillars = req.pillars.map((p) => {
      const cur = p.cur(S);
      const pct = Math.min(100, Math.round((cur / p.need) * 100));
      return { ...p, cur, pct, done: cur >= p.need };
    });
    const pct = pillars.length ? Math.min(...pillars.map((p) => p.pct)) : 0;
    return { pct, pillars, ready: pillars.every((p) => p.done) };
  }

  function canPromote(S) {
    const next = (S.studioStars || 1) + 1;
    if (next > 5) return false;
    return pillarProgress(S, NEXT_REQ[next]).ready;
  }

  let _pendingRankUp = false;

  function modalBlocking() {
    if (window.crisisModalOpen && window.crisisModalOpen()) return true;
    const prem = document.getElementById("premiere");
    if (prem && prem.style.display === "flex") return true;
    const rank = document.getElementById("jw-rankup");
    if (rank && rank.style.display === "flex") return true;
    return false;
  }

  function syncStarsFromSave(S, hook) {
    initState(S);
    const before = S.studioStars || 1;
    while (canPromote(S)) {
      const next = S.studioStars + 1;
      const req = NEXT_REQ[next];
      S.studioStars = next;
      S.studioStarBest = Math.max(S.studioStarBest || 1, next);
      if (!S.studioStarPerks[next]) {
        S.studioStarPerks[next] = true;
        if (req) S.gems = (S.gems || 0) + (req.gems || 0);
      }
    }
    if (S.studioStars > before) {
      hook.toast(`⭐ Studio rating synced to ${S.studioStars}★ — rewards granted`, true);
      hook.save();
    }
  }

  function tryPendingRankUp(hook) {
    if (!_pendingRankUp) return;
    if (modalBlocking()) return;
    _pendingRankUp = false;
    const S = hook.getState();
    if (canPromote(S)) promoteOne(S, hook);
  }

  function promoteOne(S, hook) {
    if (!canPromote(S)) return false;
    if (modalBlocking()) {
      _pendingRankUp = true;
      return false;
    }
    const next = S.studioStars + 1;
    const req = NEXT_REQ[next];
    const ti = tierInfo(next);
    S.studioStars = next;
    S.studioStarBest = Math.max(S.studioStarBest || 1, next);
    S.studioStarPerks[next] = true;
    S.gems = (S.gems || 0) + (req.gems || 0);
    showRankUp(next, ti, req, hook);
    if (typeof window.checkAchievements === "function") window.checkAchievements();
    hook.save();
    return true;
  }

  function starsHTML(n, size) {
    const filled = "★".repeat(n);
    const empty = "☆".repeat(5 - n);
    return `<span class="jw-stars jw-stars-${size || "md"}" aria-label="${n} of 5 stars">${filled}${empty}</span>`;
  }

  function ensureModal() {
    if (document.getElementById("jw-rating-overlay")) return;
    const el = document.createElement("div");
    el.id = "jw-rating-overlay";
    el.className = "overlay";
    el.style.display = "none";
    el.innerHTML = `<div class="card-modal jw-rating-card">
      <button class="jw-rating-close" data-jw-close aria-label="Close">✕</button>
      <div id="jw-rating-body"></div>
    </div>`;
    document.body.appendChild(el);

    const rank = document.createElement("div");
    rank.id = "jw-rankup";
    rank.className = "overlay";
    rank.style.display = "none";
    rank.innerHTML = `<div class="card-modal jw-rankup-card">
      <div class="jw-rankup-burst">✨</div>
      <div id="jw-rankup-stars"></div>
      <h2 id="jw-rankup-title">STUDIO RATING UP!</h2>
      <p id="jw-rankup-sub" class="muted"></p>
      <div id="jw-rankup-reward" class="jw-rankup-reward"></div>
      <button class="btn-primary" data-jw-rankup-close style="width:100%;margin-top:14px">Continue ▶</button>
    </div>`;
    document.body.appendChild(rank);
  }

  function ratingPanelHTML(S, hook) {
    const stars = S.studioStars || 1;
    const ti = tierInfo(stars);
    const next = stars < 5 ? stars + 1 : null;
    const req = next ? NEXT_REQ[next] : null;
    const prog = pillarProgress(S, req);
    const bonus = Math.round(ti.bonus * 100);

    let pillarRows = "";
    if (req) {
      pillarRows = prog.pillars
        .map(
          (p) => `<div class="jw-pillar">
        <div class="jw-pillar-head"><span>${p.icon} ${p.label}</span><span>${hook.fmt(p.cur)} / ${hook.fmt(p.need)}</span></div>
        <div class="jw-bar"><i style="width:${p.pct}%"></i></div>
      </div>`
        )
        .join("");
    }

    const unlockRows = TIERS.map((t, i) => {
      const idx = i + 1;
      const on = stars >= idx;
      return `<div class="jw-unlock ${on ? "on" : ""}"><span>${t.icon} ${idx}★ ${t.name}</span><small>${UNLOCK_BLURBS[idx] || ""}</small></div>`;
    }).join("");

    return `<div class="jw-rating-hero">
      <div class="jw-rating-stars">${starsHTML(stars, "lg")}</div>
      <h2>${ti.icon} ${ti.name}</h2>
      <p class="muted">Jurassic-style studio rating — fill every pillar to earn the next star.</p>
    </div>
    <div class="jw-rating-kpis">
      <div><b>+${bonus}%</b><small>Premiere bonus</small></div>
      <div><b>${stars}/5</b><small>Studio stars</small></div>
      <div><b>${hook.fmt(S.releases || 0)}</b><small>Premieres</small></div>
    </div>
    ${
      next
        ? `<div class="jw-next-block">
      <div class="jw-next-head"><span>Progress to ${starsHTML(next, "sm")}</span><span>${prog.pct}%</span></div>
      <div class="jw-bar jw-bar-main"><i style="width:${prog.pct}%"></i></div>
      <p class="muted" style="font-size:12px;margin:8px 0 0">${req.blurb}</p>
      ${pillarRows}
      <div class="jw-reward-tag">Rank-up reward: <b>+${req.gems} 💎</b></div>
    </div>`
        : `<div class="jw-max-block"><div style="font-size:42px">👑</div><b>MAX STUDIO RATING</b><p class="muted">You've reached 5★ — a true anime empire.</p></div>`
    }
    <div class="jw-unlock-list"><div class="jw-unlock-title">Rating unlocks</div>${unlockRows}</div>`;
  }

  function showRatingPanel(hook) {
    ensureModal();
    const S = hook.getState();
    initState(S);
    document.getElementById("jw-rating-body").innerHTML = ratingPanelHTML(S, hook);
    document.getElementById("jw-rating-overlay").style.display = "flex";
  }

  function showRankUp(stars, ti, req, hook) {
    ensureModal();
    document.getElementById("jw-rankup-stars").innerHTML = starsHTML(stars, "xl");
    document.getElementById("jw-rankup-title").textContent = `${stars}★ STUDIO RATING!`;
    document.getElementById("jw-rankup-sub").textContent = `${ti.name} — ${req.blurb}`;
    document.getElementById("jw-rankup-reward").innerHTML = `+${req.gems} 💎 · +${Math.round(ti.bonus * 100)}% premiere power`;
    const m = document.getElementById("jw-rankup");
    m.style.display = "flex";
    m.classList.remove("jw-rankup-pop");
    void m.offsetWidth;
    m.classList.add("jw-rankup-pop");
    hook.play("reward");
    try {
      if (window.STEAM_ACHIEVE && stars >= 5) window.STEAM_ACHIEVE("studio5");
    } catch (e) {}
  }

  function ratingEl() {
    return document.getElementById("hud-studio-rating") || document.getElementById("studio-rank");
  }

  function updateHud(S, hook) {
    const el = ratingEl();
    if (!el) return;
    const stars = S.studioStars || 1;
    const ti = tierInfo(stars);
    const next = stars < 5 ? stars + 1 : null;
    const pct = next ? pillarProgress(S, NEXT_REQ[next]).pct : 100;
    el.className = "hud-studio-rating jw-studio-rank" + (stars >= 5 ? " jw-max" : "");
    el.title = "Tap for Studio Rating";
    el.innerHTML = `<span class="jw-rank-icon">${ti.icon}</span>
      <span class="jw-rank-stars">${starsHTML(stars, "sm")}</span>
      <span class="rank-tier">${ti.name}</span>
      ${next ? `<span class="jw-rank-pct" style="--jw-pct:${pct}%"></span>` : ""}`;
  }

  function recordPremiere(S, stars) {
    S.premiereStats = S.premiereStats || { fourPlus: 0, five: 0 };
    if (stars >= 4) S.premiereStats.fourPlus = (S.premiereStats.fourPlus || 0) + 1;
    if (stars >= 5) S.premiereStats.five = (S.premiereStats.five || 0) + 1;
  }

  function premiereMult(S) {
    const ti = tierInfo(S.studioStars || 1);
    return 1 + (ti.bonus || 0);
  }

  function installHooks() {
    const hook = window.__AST_HOOK__;
    if (!hook || hook.__jwRatingInstalled) return false;
    hook.__jwRatingInstalled = true;

    initState(hook.getState());
    syncStarsFromSave(hook.getState(), hook);
    ensureModal();

    hook.studioStars = () => hook.getState().studioStars || 1;
    hook.studioRatingMult = () => premiereMult(hook.getState());
    hook.projectStarLock = (p) => {
      const S = hook.getState();
      return (S.studioStars || 1) < (p.starUnlock || 1);
    };

    const origRender = hook.render;
    hook.render = function () {
      origRender();
      const S = hook.getState();
      initState(S);
      updateHud(S, hook);
      if (S.tab === "produce" && !document.documentElement.classList.contains("hud-v3-active")) injectProduceBanner(S, hook);
    };

    function afterProgressCheck(hook) {
      const S = hook.getState();
      if (canPromote(S)) promoteOne(S, hook);
      updateHud(S, hook);
    }

    const origRelease = hook.releaseProject;
    hook.releaseProject = function (slot) {
      const S = hook.getState();
      const pr = S.projects[slot];
      let stars = 0;
      if (pr) stars = hook.projectStars(hook.getProject(pr.pid), pr.genre, pr);
      const before = S.studioStars || 1;
      S._jwReleaseMult = premiereMult(S);
      try {
        origRelease(slot);
      } finally {
        delete S._jwReleaseMult;
      }
      if (stars) recordPremiere(S, stars);
      if ((S.studioStars || 1) === before && canPromote(S)) promoteOne(S, hook);
      else updateHud(S, hook);
    };

    const origExpand = hook.expandStudio;
    if (origExpand) {
      hook.expandStudio = function () {
        origExpand();
        afterProgressCheck(hook);
      };
    }

    const origHire = hook.hire;
    if (origHire) {
      hook.hire = function (role) {
        origHire(role);
        afterProgressCheck(hook);
      };
    }

    if (hook.pullStar) {
      const origPull = hook.pullStar;
      hook.pullStar = function () {
        const r = origPull.apply(this, arguments);
        afterProgressCheck(hook);
        return r;
      };
    }

    document.addEventListener("click", (e) => {
      if (e.target.closest("#hud-studio-rating, #studio-rank")) {
        showRatingPanel(hook);
        return;
      }
      if (e.target.closest("[data-jw-close]")) {
        document.getElementById("jw-rating-overlay").style.display = "none";
        return;
      }
      if (e.target.closest("[data-jw-rankup-close]")) {
        document.getElementById("jw-rankup").style.display = "none";
        hook.render();
        tryPendingRankUp(hook);
      }
    });

    const origClosePremiere = window.closePremiere;
    if (typeof origClosePremiere === "function") {
      window.closePremiere = function () {
        origClosePremiere();
        tryPendingRankUp(hook);
      };
    }

    window.__AST_TRY_RANKUP__ = () => tryPendingRankUp(hook);
    const origUpdateTop = window.updateTopBar;
    window.updateTopBar = function () {
      if (typeof origUpdateTop === "function") origUpdateTop();
      updateHud(hook.getState(), hook);
    };
    updateHud(hook.getState(), hook);
    return true;
  }

  function injectProduceBanner(S, hook) {
    const main = document.getElementById("main");
    if (!main || main.querySelector("#jw-produce-rating")) return;
    const stars = S.studioStars || 1;
    const next = stars < 5 ? stars + 1 : null;
    const pct = next ? pillarProgress(S, NEXT_REQ[next]).pct : 100;
    const anchor = main.querySelector(".eventbar") || main.firstChild;
    if (!anchor) return;
    anchor.insertAdjacentHTML(
      "afterend",
      `<div class="jw-produce-rating" id="jw-produce-rating" data-jw-open>
        <div class="jw-produce-left"><span>${starsHTML(stars, "sm")}</span><b>${tierInfo(stars).name}</b></div>
        <div class="jw-produce-mid">${next ? `<span>Next star</span><div class="jw-bar"><i style="width:${pct}%"></i></div><small>${pct}%</small>` : "<span>MAX RATING 👑</span>"}</div>
        <button class="btn-ghost" data-jw-open style="font-size:11px;padding:6px 10px">Rating</button>
      </div>`
    );
    main.querySelectorAll("[data-jw-open]").forEach((el) => {
      el.addEventListener("click", (e) => { e.stopPropagation(); showRatingPanel(hook); });
    });
  }

  window.__AST_STUDIO_RATING__ = {
    tierInfo,
    pillarProgress,
    starsHTML,
    TIERS,
    initState,
    refreshHud: (S, hook) => updateHud(S || (hook || window.__AST_HOOK__)?.getState?.(), hook || window.__AST_HOOK__),
  };

  const poll = setInterval(() => {
    if (installHooks()) clearInterval(poll);
  }, 80);
})();