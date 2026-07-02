/**
 * Anime Studio Tycoon — UI Complete (v27)
 * Tab hero banners, produce grid, star cards, store shelf, quest chest, achievements strip.
 */
(function () {
  const TAB_META = {
    produce: { ic: "🎬", title: "Production Floor", sub: "Greenlight shows, tap to boost, premiere hits" },
    quests: { ic: "📋", title: "Rewards Center", sub: "Daily quests, login calendar, weekly challenges" },
    staff: { ic: "👥", title: "Creative Staff", sub: "Hire animators, writers, directors & producers" },
    stars: { ic: "⭐", title: "Star Talent", sub: "Scout legends, manage energy, build your roster" },
    research: { ic: "🔬", title: "Genre Lab", sub: "Master genres for permanent quality bonuses" },
    studio: { ic: "🏢", title: "Studio HQ", sub: "Upgrades, legacy perks, dynasty & records" },
    market: { ic: "📣", title: "Marketing", sub: "Ad campaigns to grow your fanbase fast" },
    store: { ic: "💎", title: "Studio Store", sub: "Gems, Producer Pass, premium bundles" },
  };

  const DEPT_ORDER = [
    { key: "animator", label: "Animation Department" },
    { key: "writer", label: "Writing Room" },
    { key: "director", label: "Direction" },
    { key: "voice", label: "Voice Booth" },
    { key: "producer", label: "Production Office" },
  ];

  function readyCount(S, hook) {
    let n = 0;
    for (const pr of S.projects || []) {
      if (!pr) continue;
      const p = hook.getProject(pr.pid);
      if (pr.progress >= p.work) n++;
    }
    return n;
  }

  function activeCount(S) {
    return (S.projects || []).filter(Boolean).length;
  }

  function claimableQuests(S) {
    const MET = { rel: "releases", rel2: "releases", yen: "yen", big: "yen", camp: "campaigns", hire: "hires", hire2: "hires", hype: "hypeSpent", scout: "scouts", green: "greenlit", tap: "taps", tap2: "taps" };
    let n = 0;
    (S.quests || []).forEach((q) => { if (!q.claimed && ((S.questProg || {})[MET[q.id] || q.id] || 0) >= q.goal) n++; });
    (S.weeklyQuests || []).forEach((q) => { if (!q.claimed && ((S.weekProg || {})[MET[q.id] || q.id] || 0) >= q.goal) n++; });
    return n;
  }

  function tabStats(S, hook, tab) {
    const chips = [];
    if (tab === "produce") {
      const ready = readyCount(S, hook);
      chips.push({ t: activeCount(S) + "/" + (S.slots || 1) + " lines", hot: false });
      if (ready) chips.push({ t: ready + " ready to premiere", hot: true });
      chips.push({ t: (S.releases || 0) + " released", hot: false });
      if ((S.combo || 0) >= 2) chips.push({ t: "combo ×" + S.combo, hot: true });
    }
    if (tab === "stars") {
      chips.push({ t: (S.stars || []).length + " stars", hot: false });
      const legs = (S.stars || []).filter((st) => {
        const t = hook.STAR_BY_ID[st.sid];
        return t && hook.effRarity(st) === "Legendary";
      }).length;
      if (legs) chips.push({ t: legs + " legendary", hot: true });
    }
    if (tab === "staff") {
      const st = S.staff || {};
      const total = (st.animator || 0) + (st.writer || 0) + (st.director || 0) + (st.voice || 0) + (st.producer || 0);
      chips.push({ t: total + " hired", hot: false });
    }
    if (tab === "quests") {
      const c = claimableQuests(S);
      chips.push({ t: (S.dailyStreak || 0) + " day streak", hot: false });
      if (c) chips.push({ t: c + " to claim", hot: true });
    }
    if (tab === "studio") {
      chips.push({ t: "Lv " + (S.studioLevel || 1), hot: false });
      const dyn = Math.max(0, (S.dynastyPoints || 0) - (S.dynastySpent || 0));
      if (dyn >= 12) chips.push({ t: dyn + " dynasty pts", hot: true });
    }
    if (tab === "store") {
      chips.push({ t: (S.gems || 0) + " 💎", hot: false });
      if (!S.producerPass) chips.push({ t: "Pass available", hot: true });
    }
    if (tab === "market") {
      chips.push({ t: fmt(S.fans) + " fans", hot: false });
    }
    if (tab === "research") {
      const max = Math.max(0, ...Object.values(S.mastery || {}));
      chips.push({ t: "best L" + max, hot: max >= 5 });
    }
    return chips;
  }

  function fmt(n) {
    n = Math.floor(n);
    if (!isFinite(n)) return "∞";
    if (n < 1000) return "" + n;
    const u = ["", "K", "M", "B", "T"];
    let i = 0;
    let x = n;
    while (x >= 1000 && i < u.length - 1) { x /= 1000; i++; }
    return (x >= 100 ? x.toFixed(0) : x.toFixed(1).replace(/\.0$/, "")) + u[i];
  }

  function injectTabHero(S, hook) {
    if (document.documentElement.classList.contains("hud-v3-active")) return;
    const main = document.getElementById("main");
    if (!main) return;
    const old = main.querySelector(".ui-tab-hero");
    if (old) old.remove();
    const meta = TAB_META[S.tab];
    if (!meta) return;
    const chips = tabStats(S, hook, S.tab);
    const el = document.createElement("div");
    el.className = "ui-tab-hero";
    el.innerHTML = `<div class="uth-ic">${meta.ic}</div>
      <div class="uth-body">
        <div class="uth-title">${meta.title}</div>
        <div class="uth-sub">${meta.sub}</div>
        <div class="uth-stats">${chips.map((c) => `<span class="ui-stat-chip${c.hot ? " hot" : ""}">${c.t}</span>`).join("")}</div>
      </div>`;
    main.insertBefore(el, main.firstChild);
  }

  function layoutProduce() {
    const main = document.getElementById("main");
    if (!main) return;
    let wrap = document.getElementById("ui-prod-slots");
    if (wrap) {
      while (wrap.firstChild) main.insertBefore(wrap.firstChild, wrap);
      wrap.remove();
    }
    const slots = [...main.querySelectorAll(".slotpanel")];
    if (!slots.length) return;
    wrap = document.createElement("div");
    wrap.id = "ui-prod-slots";
    wrap.className = "ui-prod-slots";
    main.insertBefore(wrap, slots[0]);
    slots.forEach((s) => wrap.appendChild(s));

    main.querySelectorAll(".panel").forEach((p) => {
      const h2 = p.querySelector("h2");
      if (!h2) return;
      const txt = h2.textContent || "";
      if (txt.includes("Greenlight")) p.classList.add("ui-greenlight-panel");
      if (txt.includes("Studio Lv") || txt.includes("🏢")) p.classList.add("ui-dash-panel");
    });
  }

  function layoutStars() {
    document.querySelectorAll(".staffrow").forEach((row) => {
      const txt = row.textContent || "";
      const rar = ["Legendary", "Epic", "Rare", "Common"].find((r) => txt.includes(r));
      row.classList.add("ui-star-card");
      if (rar) row.classList.add("rarity-" + rar);
    });
  }

  function layoutStaff() {
    const main = document.getElementById("main");
    if (!main) return;
    main.querySelectorAll(".ui-dept-header").forEach((e) => e.remove());
    const panel = main.querySelector(".panel.listgrid, .panel");
    if (!panel) return;
    DEPT_ORDER.forEach((dept) => {
      const rows = [...panel.querySelectorAll(".staffrow, .uprow")].filter((r) => {
        const h4 = r.querySelector("h4");
        return h4 && (h4.textContent.includes(ROLES_NAME(dept.key)) || h4.textContent.includes(DEPT_IC(dept.key)));
      });
      if (!rows.length) return;
      const hdr = document.createElement("div");
      hdr.className = "ui-dept-header";
      hdr.textContent = DEPT_IC(dept.key) + " " + dept.label;
      panel.insertBefore(hdr, rows[0]);
    });
  }

  function ROLES_NAME(k) {
    const m = { animator: "Animator", writer: "Writer", director: "Director", voice: "Voice", producer: "Producer" };
    return m[k] || k;
  }
  function DEPT_IC(k) {
    const m = { animator: "🎨", writer: "✍️", director: "🎬", voice: "🎙️", producer: "📋" };
    return m[k] || "👤";
  }

  function layoutStore(S) {
    const main = document.getElementById("main");
    if (!main) return;
    const oldHero = main.querySelector(".ui-store-hero");
    if (oldHero) oldHero.remove();
    const panel = main.querySelector(".panel");
    if (!panel) return;

    if (!S.producerPass) {
      const hero = document.createElement("div");
      hero.className = "ui-store-hero";
      hero.innerHTML = `<h3>🌟 Producer Pass</h3><p>+50% income forever · auto-release · 2× offline cap — the best upgrade in the game.</p>`;
      panel.parentNode.insertBefore(hero, panel.nextSibling);
    }

    let shelf = main.querySelector(".ui-store-shelf");
    if (!shelf) {
      shelf = document.createElement("div");
      shelf.className = "ui-store-shelf";
      const items = [...panel.querySelectorAll(".uprow, .flash-deal")];
      if (items.length) {
        const anchor = items[0];
        anchor.parentNode.insertBefore(shelf, anchor);
        items.forEach((it) => {
          it.classList.add("ui-shelf-item");
          if ((it.textContent || "").includes("OWNED")) it.classList.add("owned");
          if ((it.textContent || "").includes("BEST VALUE") || (it.textContent || "").includes("POPULAR")) it.classList.add("featured");
          shelf.appendChild(it);
        });
      }
    }
  }

  function layoutQuests(S) {
    const main = document.getElementById("main");
    if (!main) return;
    const old = main.querySelector(".ui-quest-chest");
    if (old) old.remove();
    const c = claimableQuests(S);
    if (!c) return;
    const el = document.createElement("div");
    el.className = "ui-quest-chest";
    el.innerHTML = `<span class="uqc-ic">🎁</span><span class="uqc-txt">${c} reward${c > 1 ? "s" : ""} ready to claim — scroll down!</span>`;
    const hero = main.querySelector(".ui-tab-hero");
    if (hero && hero.nextSibling) main.insertBefore(el, hero.nextSibling);
    else main.insertBefore(el, main.firstChild);
  }

  function layoutAchievements(S) {
    const main = document.getElementById("main");
    if (!main) return;
    if (S.tab !== "quests" && S.tab !== "studio") return;
    const old = main.querySelector(".ui-achieve-strip");
    if (old) old.remove();
    const ACH = window.ACHIEVEMENTS || [];
    const got = (S.achievements || []).length;
    const tot = ACH.length || 1;
    const pct = Math.round((got / tot) * 100);
    const el = document.createElement("div");
    el.className = "ui-achieve-strip";
    el.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center">
      <span style="font-weight:800;font-size:13px">🏆 Achievements</span>
      <span style="font-size:12px;color:#9d8fb8">${got}/${tot} · ${pct}%</span></div>
      <div class="ui-achieve-bar"><i style="width:${pct}%"></i></div>`;
    const hero = main.querySelector(".ui-tab-hero");
    const insertAfter = main.querySelector(".ui-quest-chest") || hero;
    if (insertAfter && insertAfter.nextSibling) main.insertBefore(el, insertAfter.nextSibling);
    else if (hero) main.insertBefore(el, hero.nextSibling);
  }

  function layoutMarket() {
    const main = document.getElementById("main");
    if (!main) return;
    const panel = main.querySelector(".panel.listgrid");
    if (!panel || panel.querySelector(".ui-campaign-grid")) return;
    const rows = [...panel.querySelectorAll(".uprow")];
    if (!rows.length) return;
    const grid = document.createElement("div");
    grid.className = "ui-campaign-grid";
    panel.insertBefore(grid, rows[0]);
    rows.forEach((r) => {
      r.classList.add("ui-campaign-card");
      grid.appendChild(r);
    });
  }

  function enhanceTab(S, hook) {
    if (document.documentElement.classList.contains("hud-v3-active")) return;
    injectTabHero(S, hook);
    if (S.tab === "produce") layoutProduce();
    if (S.tab === "stars") layoutStars();
    if (S.tab === "staff") layoutStaff();
    if (S.tab === "store") layoutStore(S);
    if (S.tab === "quests") layoutQuests(S);
    if (S.tab === "market") layoutMarket();
    layoutAchievements(S);
  }

  function install() {
    const hook = window.__AST_HOOK__;
    if (!hook || hook.__uiCompleteInstalled) return false;
    hook.__uiCompleteInstalled = true;

    const origRender = hook.render;
    hook.render = function () {
      origRender();
      enhanceTab(hook.getState(), hook);
    };

    enhanceTab(hook.getState(), hook);
    return true;
  }

  const poll = setInterval(() => {
    if (install()) clearInterval(poll);
  }, 60);
})();