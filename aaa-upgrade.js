/**
 * Anime Studio Tycoon — AAA upgrade layer v2
 * Studio ranks, season pass, sakura FX, franchise banners, combo pill, screen shake.
 */
(function () {
  const RANKS = [
    { fans: 0, name: "Garage Studio", icon: "🎬" },
    { fans: 50, name: "Indie Label", icon: "📽️" },
    { fans: 500, name: "Rising Studio", icon: "⭐" },
    { fans: 2500, name: "TV Powerhouse", icon: "📺" },
    { fans: 12000, name: "Feature Films", icon: "🎥" },
    { fans: 50000, name: "Global Brand", icon: "🌏" },
    { fans: 200000, name: "Anime Empire", icon: "👑" },
  ];

  const SEASON_TIERS = [
    { releases: 3, gems: 5 },
    { releases: 8, gems: 8 },
    { releases: 15, gems: 12 },
    { releases: 25, gems: 18 },
    { releases: 40, gems: 25 },
    { releases: 60, gems: 35 },
    { releases: 90, gems: 50 },
    { releases: 130, gems: 70 },
    { releases: 180, gems: 95 },
    { releases: 250, gems: 150 },
  ];

  let lastRankIdx = 0;

  /* ---- Loading splash ---- */
  const splash = document.createElement("div");
  splash.id = "loading-splash";
  splash.innerHTML = `
    <img class="splash-hero" src="start-hero.png?v=54" width="96" height="96" alt="">
    <h1>Anime Studio Tycoon</h1>
    <div class="splash-tag">Loading your empire…</div>
    <div id="loading-bar"><i></i></div>`;
  document.body.prepend(splash);
  let loadPct = 0;
  const loadIv = setInterval(() => {
    loadPct = Math.min(100, loadPct + 8 + Math.random() * 12);
    const bar = splash.querySelector("#loading-bar i");
    if (bar) bar.style.width = loadPct + "%";
    if (loadPct >= 100) {
      clearInterval(loadIv);
      setTimeout(() => splash.classList.add("hide"), 300);
    }
  }, 120);

  /* ---- Sakura particles ---- */
  const canvas = document.createElement("canvas");
  canvas.id = "fx-canvas";
  document.body.prepend(canvas);
  const ctx = canvas.getContext("2d");
  let petals = [];

  function resizeCanvas() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
  }
  resizeCanvas();
  addEventListener("resize", resizeCanvas);

  function spawnPetal(x, y, burst) {
    petals.push({
      x: x ?? Math.random() * canvas.width,
      y: y ?? -10,
      r: burst ? 3 + Math.random() * 5 : 2 + Math.random() * 4,
      vx: burst ? (Math.random() - 0.5) * 4 : (Math.random() - 0.5) * 0.8,
      vy: burst ? -2 - Math.random() * 3 : 0.6 + Math.random() * 1.2,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * (burst ? 0.08 : 0.04),
      a: burst ? 0.7 : 0.25 + Math.random() * 0.35,
    });
  }

  function drawPetals() {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (petals.length < 28 && Math.random() < 0.15) spawnPetal();
    petals = petals.filter((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      if (p.y > canvas.height + 20) return false;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = p.a;
      ctx.fillStyle = "#ffb8d4";
      ctx.beginPath();
      ctx.ellipse(0, 0, p.r, p.r * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return true;
    });
    requestAnimationFrame(drawPetals);
  }
  requestAnimationFrame(drawPetals);

  function burstParticles(n) {
    for (let i = 0; i < n; i++) {
      spawnPetal(canvas.width / 2 + (Math.random() - 0.5) * 120, canvas.height * 0.4, true);
    }
  }

  window.__AST_FX__ = { burst: burstParticles, shake: screenShake };

  function studioRank(fans) {
    let r = RANKS[0];
    let idx = 0;
    for (let i = 0; i < RANKS.length; i++) {
      if (fans >= RANKS[i].fans) { r = RANKS[i]; idx = i; }
    }
    return { ...r, idx };
  }

  function ensureComboPill() {
    let el = document.getElementById("combo-pill");
    if (el) return el;
    const top = document.getElementById("top");
    if (!top) return null;
    el = document.createElement("div");
    el.id = "combo-pill";
    top.appendChild(el);
    return el;
  }

  function updateComboPill(S) {
    const el = ensureComboPill();
    if (!el) return;
    const combo = S.combo || 0;
    if (combo >= 2) {
      el.classList.add("show");
      el.textContent = `🔥 COMBO ×${combo}`;
    } else {
      el.classList.remove("show");
    }
  }

  function updateRankBadge() {
    const hook = window.__AST_HOOK__;
    if (!hook) return;
    if (hook.__jwRatingInstalled) {
      updateComboPill(hook.getState());
      return;
    }
    const S = hook.getState();
    const el = document.getElementById("studio-rank");
    if (!el) return;
    const r = studioRank(S.fans || 0);
    el.innerHTML = `<span>${r.icon}</span><span class="rank-tier">${r.name}</span>`;
    if (r.idx > lastRankIdx) {
      lastRankIdx = r.idx;
      el.classList.remove("rank-up");
      void el.offsetWidth;
      el.classList.add("rank-up");
      if (r.idx > 0) hook.toast(`${r.icon} Studio Rank Up: ${r.name}!`, true);
    }
    updateComboPill(S);
  }

  function franchiseHTML(S) {
    const fr = S.franchises || {};
    const entries = Object.entries(fr).filter(([, v]) => v >= 2).sort((a, b) => b[1] - a[1]);
    if (!entries.length) return "";
    const top = entries[0];
    const bonus = Math.min(top[1] - 1, 5) * 8;
    const suffix = ["", "", "II", "III", "IV", "V", "VI"][top[1]] || top[1];
    return `<div class="franchise-banner"><span>📺</span><div><b>${top[0]} ${suffix}</b> · Season ${top[1]} · +${bonus}% franchise bonus on sequels</div></div>`;
  }

  function masteryHTML(S) {
    const m = S.mastery || {};
    const entries = Object.entries(m).filter(([, v]) => v >= 3).sort((a, b) => b[1] - a[1]);
    if (!entries.length) return "";
    const top = entries[0];
    const bonus = Math.min(top[1], 10) * 3;
    return `<div class="mastery-banner"><span>🎨</span><div><b>${top[0]} Mastery Lv.${top[1]}</b> · +${bonus}% quality on ${top[0]} shows</div></div>`;
  }

  function seasonPassHTML(S) {
    const claimed = S.seasonClaimed || [];
    let h = `<div class="panel" id="season-pass-panel"><h2>🎫 Season Pass</h2><div class="muted" style="margin-bottom:8px">Free gem rewards for premiere milestones — no paywall.</div><div class="season-track">`;
    SEASON_TIERS.forEach((t, i) => {
      const done = claimed.includes(i);
      const ready = !done && (S.releases || 0) >= t.releases;
      h += `<div class="season-tier ${done ? "claimed" : ready ? "ready" : ""}" data-season="${i}">
        <div>${t.releases} shows</div><span class="st-gems">+${t.gems}💎</span>${done ? "<div>✓</div>" : ready ? "<div>CLAIM</div>" : ""}</div>`;
    });
    return h + `</div></div>`;
  }

  function claimSeasonTier(i) {
    const hook = window.__AST_HOOK__;
    if (!hook) return;
    const S = hook.getState();
    const t = SEASON_TIERS[i];
    if (!t) return;
    S.seasonClaimed = S.seasonClaimed || [];
    if (S.seasonClaimed.includes(i)) return;
    if ((S.releases || 0) < t.releases) return;
    S.seasonClaimed.push(i);
    S.gems = (S.gems || 0) + t.gems;
    hook.toast(`🎫 Season Pass: +${t.gems} Gems!`, true);
    hook.play("reward");
    hook.save();
    hook.render();
    burstParticles(16);
  }

  function screenShake() {
    const app = document.getElementById("app");
    if (!app) return;
    app.classList.remove("screen-shake");
    void app.offsetWidth;
    app.classList.add("screen-shake");
    setTimeout(() => app.classList.remove("screen-shake"), 500);
  }

  function flashGold() {
    const app = document.getElementById("app");
    if (!app) return;
    app.classList.remove("flash-gold");
    void app.offsetWidth;
    app.classList.add("flash-gold");
    setTimeout(() => app.classList.remove("flash-gold"), 500);
  }

  function installHooks() {
    const hook = window.__AST_HOOK__;
    if (!hook || hook.__aaaInstalled) return false;
    hook.__aaaInstalled = true;

    const origRender = hook.render;
    hook.render = function () {
      origRender();
      updateRankBadge();
      const S = hook.getState();
      const main = document.getElementById("main");
      if (!main) return;

      if (S.tab === "produce") {
        main.querySelectorAll(".franchise-banner, .mastery-banner").forEach((e) => e.remove());
        const fb = franchiseHTML(S);
        const mb = masteryHTML(S);
        const anchor = main.querySelector(".eventbar") || main.firstChild;
        if (fb && anchor) anchor.insertAdjacentHTML("afterend", fb);
        if (mb) {
          const after = main.querySelector(".franchise-banner") || main.querySelector(".eventbar");
          if (after) after.insertAdjacentHTML("afterend", mb);
        }
      }

      if (S.tab === "quests") {
        const existing = document.getElementById("season-pass-panel");
        if (existing) existing.remove();
        main.insertAdjacentHTML("beforeend", seasonPassHTML(S));
      }
    };

    const origRelease = hook.releaseProject;
    hook.releaseProject = function (slot) {
      const S = hook.getState();
      const pr = S.projects[slot];
      const p = pr ? hook.getProject(pr.pid) : null;
      const prevCombo = S.combo || 0;
      origRelease(slot);
      if (p) {
        if (p.tier >= 3 || (pr && pr.seq >= 3)) {
          screenShake();
          burstParticles(24);
        } else if (p.tier >= 2) {
          burstParticles(12);
        }
        if ((S.combo || 0) >= 5 && prevCombo < 5) {
          flashGold();
          burstParticles(20);
        }
      }
    };

    document.addEventListener("click", (e) => {
      const t = e.target.closest("[data-season]");
      if (t) claimSeasonTier(+t.dataset.season);
    });

    const S = hook.getState();
    lastRankIdx = studioRank(S.fans || 0).idx;
    updateRankBadge();
    return true;
  }

  const poll = setInterval(() => {
    if (installHooks()) clearInterval(poll);
  }, 80);
})();