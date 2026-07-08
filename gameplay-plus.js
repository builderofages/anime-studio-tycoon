/**
 * Anime Studio Tycoon — Gameplay+ expansion
 * Daily goals, smart cast, merch, rivals, trend forecast, settings, auto-greenlight, pity UI, news ticker.
 */
(function () {
  const PITY_EPIC = 25;
  const PITY_LEG = 80;
  const MERCH_UNLOCK = 500;

  const NEWS = [
    "📰 Industry buzz: isekai fatigue or golden age?",
    "📺 Streaming wars heat up — studios race for exclusives",
    "🌸 Sakura season drives romance anime to #1 trending",
    "🏆 Awards season: critics favor grounded slice-of-life",
    "🔥 A viral clip just made a nobody studio famous overnight",
    "💎 Merch sales hit record highs across the industry",
    "🎬 Feature films are back — theatrical premieres surge",
    "⭐ Legendary voice actor announces surprise retirement",
  ];

  const DAILY_GOAL_POOL = [
    { id: "rel2", label: "Premiere 2 anime", metric: "releases", need: 2, gems: 4 },
    { id: "rel5", label: "Premiere 5 anime", metric: "releases", need: 5, gems: 8 },
    { id: "hire3", label: "Hire 3 staff", metric: "hires", need: 3, gems: 3 },
    { id: "scout1", label: "Scout 1 talent", metric: "scouts", need: 1, gems: 4 },
    { id: "camp2", label: "Run 2 campaigns", metric: "campaigns", need: 2, gems: 3 },
    { id: "tap30", label: "Tap-boost 30 times", metric: "taps", need: 30, gems: 3 },
    { id: "green3", label: "Greenlight 3 projects", metric: "greenlit", need: 3, gems: 4 },
    { id: "hype20", label: "Spend 20 Hype", metric: "hypeSpent", need: 20, gems: 4 },
    { id: "yen50k", label: "Earn ¥50K", metric: "yen", need: 50000, gems: 5 },
  ];

  const MERCH_TIERS = [
    { lvl: 1, name: "Sticker Packs", cost: 2500, income: 3, fans: 0 },
    { lvl: 2, name: "Figurine Line", cost: 12000, income: 12, fans: 200 },
    { lvl: 3, name: "Apparel Drop", cost: 55000, income: 45, fans: 800 },
    { lvl: 4, name: "Café Collab", cost: 220000, income: 150, fans: 2500 },
    { lvl: 5, name: "Global Merch Empire", cost: 900000, income: 500, fans: 8000 },
  ];

  function todayStr() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function weekKey() {
    const d = new Date();
    const onejan = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil(((d - onejan) / 86400000 + onejan.getDay() + 1) / 7);
    return d.getFullYear() + "-W" + week;
  }

  /* ---- News ticker ---- */
  function setupTicker() {
    if (document.getElementById("news-ticker")) return;
    const el = document.createElement("div");
    el.id = "news-ticker";
    const msg = NEWS[Math.floor(Math.random() * NEWS.length)];
    el.innerHTML = `<div class="tick-inner">${msg} &nbsp;&nbsp;·&nbsp;&nbsp; ${NEWS[(Math.floor(Math.random() * NEWS.length) + 3) % NEWS.length]} &nbsp;&nbsp;·&nbsp;&nbsp; Match the 🔥 trending genre for bonus fans & yen!</div>`;
    document.body.prepend(el);
    document.body.classList.add("has-ticker");
  }

  /* ---- Daily goals ---- */
  function ensureDailyGoals(S) {
    S.plusGoals = S.plusGoals || [];
    S.plusGoalsDate = S.plusGoalsDate || "";
    S.plusGoalsBase = S.plusGoalsBase || {};
    if (S.plusGoalsDate !== todayStr()) {
      const shuffled = [...DAILY_GOAL_POOL].sort(() => Math.random() - 0.5);
      S.plusGoals = shuffled.slice(0, 3).map((g) => ({ ...g, claimed: false }));
      S.plusGoalsDate = todayStr();
      S.plusGoalsBase = {
        releases: S.releases || 0,
        hires: S.questProg?.hires || 0,
        scouts: S.questProg?.scouts || 0,
        campaigns: S.questProg?.campaigns || 0,
        taps: S.taps || 0,
        greenlit: S.questProg?.greenlit || 0,
        hypeSpent: S.questProg?.hypeSpent || 0,
        yen: S.totalEarned || 0,
      };
    }
  }

  function dailyGoalProg(S, g) {
    const base = S.plusGoalsBase || {};
    const qp = S.questProg || {};
    switch (g.metric) {
      case "releases": return (S.releases || 0) - (base.releases || 0);
      case "hires": return (qp.hires || 0) - (base.hires || 0);
      case "scouts": return (qp.scouts || 0) - (base.scouts || 0);
      case "campaigns": return (qp.campaigns || 0) - (base.campaigns || 0);
      case "taps": return (S.taps || 0) - (base.taps || 0);
      case "greenlit": return (qp.greenlit || 0) - (base.greenlit || 0);
      case "hypeSpent": return (qp.hypeSpent || 0) - (base.hypeSpent || 0);
      case "yen": return (S.totalEarned || 0) - (base.yen || 0);
      default: return 0;
    }
  }

  function dailyGoalsHTML(S) {
    ensureDailyGoals(S);
    let h = `<div class="panel daily-goals" id="daily-goals-panel"><h2>🎯 Today's Goals</h2><div class="muted" style="margin-bottom:8px">3 quick wins — claim gem rewards before midnight!</div>`;
    (S.plusGoals || []).forEach((g, i) => {
      const prog = Math.min(g.need, dailyGoalProg(S, g));
      const done = prog >= g.need;
      const claimed = g.claimed;
      h += `<div class="dg-row ${claimed ? "done" : done ? "ready" : ""}">
        <div class="dg-check">${claimed ? "✓" : done ? "!" : prog}</div>
        <div style="flex:1"><b style="font-size:13px">${g.label}</b><div class="muted" style="font-size:11px">${prog}/${g.need} · +${g.gems}💎</div></div>
        ${done && !claimed ? `<button class="btn-gold hirebtn" data-plus-goal="${i}" style="min-height:36px;padding:6px 12px">Claim</button>` : ""}
      </div>`;
    });
    return h + `</div>`;
  }

  function claimDailyGoal(i) {
    const hook = window.__AST_HOOK__;
    if (!hook) return;
    const S = hook.getState();
    ensureDailyGoals(S);
    const g = S.plusGoals[i];
    if (!g || g.claimed) return;
    if (dailyGoalProg(S, g) < g.need) return;
    g.claimed = true;
    S.gems = (S.gems || 0) + g.gems;
    hook.toast(`🎯 Daily Goal: +${g.gems} Gems!`, true);
    hook.play("reward");
    hook.save();
    hook.render();
  }

  /* ---- Smart cast ---- */
  function smartCast(S, hook) {
    const stars = S.stars || [];
    if (!stars.length) {
      hook.toast("Scout stars first — Stars tab!");
      return;
    }
    const cap = hook.castCap();
    const order = ["Legendary", "Epic", "Rare", "Common"];
    const roster = stars
      .map((st) => ({ st, t: hook.STAR_BY_ID[st.sid] }))
      .filter((x) => x.t && !x.st.resting && hook.starEnergy(x.st) >= 15)
      .sort((a, b) => {
        const ra = order.indexOf(hook.effRarity(a.st));
        const rb = order.indexOf(hook.effRarity(b.st));
        return ra - rb || (b.st.level || 1) - (a.st.level || 1);
      })
      .slice(0, cap)
      .map((x) => x.st.sid);
    hook.setCastSel(roster);
    hook.toast(`🎭 Smart Cast: ${roster.length} star${roster.length !== 1 ? "s" : ""} ready`, true);
    hook.render();
  }

  /* ---- Trend forecast ---- */
  function updateTrendForecast(S, hook) {
    const el = document.getElementById("trend-forecast");
    if (!el || !S.trendUntil) return;
    const left = Math.max(0, Math.ceil((S.trendUntil - Date.now()) / 1000));
    const genres = hook.GENRES;
    const next = genres[(S.trendIdx + 1) % genres.length];
    el.textContent = `→ ${next} in ${left}s`;
  }

  /* ---- Merch ---- */
  function merchPerSec(S) {
    const lvl = S.merchLevel || 0;
    if (!lvl) return 0;
    const tier = MERCH_TIERS[lvl - 1];
    return Math.floor((tier?.income || 0) * (1 + (S.fans || 0) * 0.00002) * hookPerk(S));
  }
  function hookPerk(S) {
    return 1 + ((S.perks?.income || 0) * 0.05);
  }

  function merchHTML(S, hook) {
    if ((S.fans || 0) < MERCH_UNLOCK) {
      return `<div class="panel merch-panel"><h2>🧸 Merch Line</h2><div class="muted">Unlock at ${hook.fmt(MERCH_UNLOCK)} fans — passive ¥/sec from merchandise!</div></div>`;
    }
    const lvl = S.merchLevel || 0;
    const income = merchPerSec(S);
    let h = `<div class="panel merch-panel"><h2>🧸 Merch Line <span class="pill">¥${hook.fmt(income)}/s</span></h2>
      <div class="muted" style="margin-bottom:8px">Your hits become hoodies, figures & café collabs — forever income.</div>`;
    MERCH_TIERS.forEach((t, i) => {
      const owned = lvl > i;
      const next = lvl === i;
      h += `<div class="merch-tier ${owned ? "owned" : ""}">
        <div style="flex:1"><b>Lv${t.lvl} ${t.name}</b><div class="muted" style="font-size:11px">+¥${t.income}/s base${t.fans ? ` · +${hook.fmt(t.fans)} fans` : ""}</div></div>
        ${owned ? "<span>✓</span>" : next ? `<button class="btn-gold hirebtn" data-merch-buy="${i}" ${S.yen >= t.cost ? "" : "disabled"}>¥${hook.fmt(t.cost)}</button>` : '<span class="muted">🔒</span>'}
      </div>`;
    });
    return h + `</div>`;
  }

  function buyMerch(i) {
    const hook = window.__AST_HOOK__;
    if (!hook) return;
    const S = hook.getState();
    const t = MERCH_TIERS[i];
    if (!t || (S.merchLevel || 0) !== i) return;
    if (S.yen < t.cost) {
      hook.toast("Need ¥" + hook.fmt(t.cost));
      return;
    }
    S.yen -= t.cost;
    S.merchLevel = i + 1;
    if (t.fans) {
      S.fans += t.fans;
      S.totalFansEver += t.fans;
    }
    hook.toast(`🧸 ${t.name} launched! +¥${t.income}/s passive`, true);
    hook.play("reward");
    hook.save();
    hook.render();
  }

  /* ---- Rival face-off ---- */
  function ensureRival(S, hook) {
    S.rivalWeek = S.rivalWeek || "";
    S.rivalTarget = S.rivalTarget || null;
    S.rivalStartVal = S.rivalStartVal || 0;
    S.rivalWins = S.rivalWins || 0;
    if (S.rivalWeek !== weekKey()) {
      const st = hook.industryStandings();
      const rivals = st.all.filter((r) => !r.me);
      const pick = rivals[Math.floor(Math.random() * Math.min(rivals.length, 8))] || rivals[0];
      S.rivalWeek = weekKey();
      S.rivalTarget = pick ? pick.name : "Neon Mirage";
      S.rivalStartVal = hook.studioValue();
      S.rivalGoal = Math.floor(S.rivalStartVal * (1.15 + Math.random() * 0.25));
      S.rivalClaimed = false;
    }
  }

  function rivalHTML(S, hook) {
    ensureRival(S, hook);
    const cur = hook.studioValue();
    const goal = S.rivalGoal || cur;
    const pct = Math.min(100, Math.max(0, ((cur - S.rivalStartVal) / Math.max(1, goal - S.rivalStartVal)) * 100));
    const won = cur >= goal;
    const cls = S.rivalClaimed ? "won" : "";
    let h = `<div class="panel rival-card ${cls}" id="rival-panel"><h2>⚔️ Weekly Rivalry</h2>
      <div class="muted" style="margin-bottom:6px">Outgrow <b>${S.rivalTarget}</b> — grow studio value to <b>${hook.fmt(goal)}</b> this week!</div>
      <div style="height:10px;border-radius:6px;background:rgba(0,0,0,.1);overflow:hidden"><div style="height:100%;width:${pct.toFixed(0)}%;background:linear-gradient(90deg,#ff7eb3,#ffcc4d)"></div></div>
      <div class="muted" style="margin-top:4px;font-size:11px">${hook.fmt(cur)} / ${hook.fmt(goal)} · ${S.rivalWins || 0} rival wins total</div>`;
    if (won && !S.rivalClaimed) {
      h += `<button class="btn-gold" data-rival-claim style="width:100%;margin-top:8px">🏆 Claim Victory · +15💎 +¥${hook.fmt(Math.floor(goal * 0.05))}</button>`;
    } else if (S.rivalClaimed) {
      h += `<div class="muted" style="margin-top:6px">✅ Victory claimed — new rival next week!</div>`;
    }
    return h + `</div>`;
  }

  function claimRival() {
    const hook = window.__AST_HOOK__;
    if (!hook) return;
    const S = hook.getState();
    ensureRival(S, hook);
    if (S.rivalClaimed || hook.studioValue() < S.rivalGoal) return;
    S.rivalClaimed = true;
    S.rivalWins = (S.rivalWins || 0) + 1;
    S.gems = (S.gems || 0) + 15;
    S.yen += Math.floor(S.rivalGoal * 0.05);
    hook.toast("⚔️ Rival defeated! +15💎", true);
    hook.play("reward");
    hook.save();
    hook.render();
  }

  /* ---- Collection book ---- */
  function collectionHTML(S, hook) {
    const pool = hook.STAR_POOL.filter((s) => !s.exclusive);
    const owned = new Set((S.stars || []).map((s) => s.sid));
    const pct = Math.round((owned.size / pool.length) * 100);
    let h = `<div class="panel"><h2>📚 Collection Book</h2>
      <div class="muted">${owned.size} / ${pool.length} talents discovered (${pct}%)</div>
      <div class="collection-bar"><i style="width:${pct}%"></i></div>`;
    if (pct >= 50 && !(S.plusCollection50)) {
      h += `<button class="btn-gold" data-collection-bonus style="width:100%;margin-top:8px">🎁 50% Collection Bonus · +20💎</button>`;
    }
    return h + `</div>`;
  }

  function claimCollectionBonus() {
    const hook = window.__AST_HOOK__;
    if (!hook) return;
    const S = hook.getState();
    const pool = hook.STAR_POOL.filter((s) => !s.exclusive);
    const owned = new Set((S.stars || []).map((s) => s.sid));
    if (owned.size / pool.length < 0.5 || S.plusCollection50) return;
    S.plusCollection50 = true;
    S.gems = (S.gems || 0) + 20;
    hook.toast("📚 Collection 50% — +20 Gems!", true);
    hook.save();
    hook.render();
  }

  /* ---- Pity meter ---- */
  function pityHTML(S) {
    const p = S.pityCount || 0;
    const pct = Math.min(100, (p / PITY_LEG) * 100);
    return `<div class="pity-meter"><span>🍀 Pity</span><div class="pity-bar"><i style="width:${pct}%"></i></div><span>${p}/${PITY_LEG}</span></div>
      <div class="muted" style="font-size:11px;margin:-4px 0 8px">Premium scouts guarantee Epic+ at ${PITY_EPIC}, Legendary at ${PITY_LEG}.</div>`;
  }

  /* ---- Production stages ---- */
  function stageHTML(pct) {
    const stages = ["📝 Pre-pro", "🎨 Animate", "✂️ Post", "🎬 Ready"];
    const idx = pct >= 100 ? 3 : pct >= 67 ? 2 : pct >= 34 ? 1 : 0;
    return `<div class="prod-stage">${stages
      .map((s, i) => `<span class="${i < idx ? "done" : i === idx ? "on" : ""}">${s}</span>`)
      .join("")}</div>`;
  }

  function injectProductionStages() {
    document.querySelectorAll(".slotpanel").forEach((panel) => {
      if (panel.querySelector(".prod-stage")) return;
      const bar = panel.querySelector(".progress i");
      if (!bar) return;
      const pct = parseFloat(bar.style.width) || 0;
      const prog = panel.querySelector(".progress");
      if (prog) prog.insertAdjacentHTML("afterend", stageHTML(pct));
    });
  }

  /* ---- Quick action bar ---- */
  function quickBarHTML(S, hook) {
    const auto = S.autoGreenlight ? "ON" : "OFF";
    return `<div class="quick-bar" id="quick-bar">
      <button class="btn-cyan" data-plus-smartcast>🎭 Smart Cast</button>
      <button class="btn-ghost" data-plus-autogl>${S.autoGreenlight ? "✅" : "⬜"} Auto-Greenlight</button>
      <button class="btn-ghost" data-plus-freelance>🖌️ +¥150</button>
      <button class="btn-ghost" data-plus-settings>⚙️ Settings</button>
    </div>`;
  }

  /* ---- Auto greenlight ---- */
  function tryAutoGreenlight(S, hook) {
    if (!S.autoGreenlight) return;
    const slot = hook.firstEmptySlot();
    if (slot < 0) return;
    const opts = hook.unlockedProjects().filter((p) => S.yen >= p.cost);
    if (!opts.length) return;
    const trend = hook.trendGenre();
    let best = opts[opts.length - 1];
    const trendMatch = opts.filter((p) => true);
    best = trendMatch[trendMatch.length - 1] || best;
    const genre = trend;
    hook.greenlight(best.id, genre, [], null);
    hook.toast(`⚡ Auto-greenlit: ${best.name} (${genre})`, true);
  }

  /* ---- Near-miss milestones ---- */
  let lastNearMiss = "";
  function checkNearMiss(S, hook) {
    const next = hook.MILESTONES?.find((m) => S.fans < m.fans);
    if (!next) return;
    const prev = [...(hook.MILESTONES || [])].reverse().find((m) => m.fans <= S.fans);
    const lo = prev ? prev.fans : 0;
    const remaining = next.fans - S.fans;
    const range = next.fans - lo;
    if (remaining > 0 && remaining <= Math.max(5, range * 0.08)) {
      const key = next.fans + "-" + remaining;
      if (lastNearMiss !== key) {
        lastNearMiss = key;
        hook.toast(`🔥 So close! ${hook.fmt(remaining)} fans to: ${next.label}`, true);
      }
    }
  }

  /* ---- Settings ---- */
  function applySettings(S) {
    const fx = document.getElementById("fx-canvas");
    const motion = S.settings?.motion !== false;
    if (fx) fx.style.display = motion && !matchMedia("(prefers-reduced-motion: reduce)").matches ? "" : "none";
    const ticker = document.getElementById("news-ticker");
    if (ticker) ticker.style.display = S.settings?.ticker !== false ? "" : "none";
  }

  function openSettings() {
    const hook = window.__AST_HOOK__;
    const S = hook?.getState();
    const panel = document.getElementById("settings");
    if (!panel) return;
    if (S) {
      const m = panel.querySelector("[data-settings-motion]");
      const t = panel.querySelector("[data-settings-ticker]");
      const a = panel.querySelector("[data-settings-autogl]");
      if (m) m.checked = S.settings?.motion !== false;
      if (t) t.checked = S.settings?.ticker !== false;
      if (a) a.checked = !!S.autoGreenlight;
    }
    panel.style.display = "flex";
  }

  function closeSettings() {
    const panel = document.getElementById("settings");
    if (panel) panel.style.display = "none";
  }

  function installHooks() {
    const hook = window.__AST_HOOK__;
    if (!hook || hook.__plusInstalled) return false;
    hook.__plusInstalled = true;

    setupTicker();

    const origRender = hook.render;
    hook.render = function () {
      origRender();
      const S = hook.getState();
      applySettings(S);
      if (document.documentElement.classList.contains("hud-v3-active")) {
        updateTrendForecast(S, hook);
        return;
      }
      updateTrendForecast(S, hook);

      const main = document.getElementById("main");
      if (!main) return;

      if (S.tab === "produce") {
        if (!main.querySelector("#quick-bar")) {
          const ev = main.querySelector(".eventbar");
          if (ev) ev.insertAdjacentHTML("afterend", quickBarHTML(S, hook));
          else main.insertAdjacentHTML("afterbegin", quickBarHTML(S, hook));
        }
        if (!main.querySelector("#daily-goals-panel")) {
          const qb = main.querySelector("#quick-bar");
          if (qb) qb.insertAdjacentHTML("afterend", dailyGoalsHTML(S));
        }
        if (!main.querySelector("#rival-panel")) {
          const dg = main.querySelector("#daily-goals-panel") || main.querySelector("#quick-bar");
          if (dg) dg.insertAdjacentHTML("afterend", rivalHTML(S, hook));
        }
        injectProductionStages();
      }

      if (S.tab === "market") {
        if (!main.querySelector(".merch-panel")) {
          main.insertAdjacentHTML("afterbegin", merchHTML(S, hook));
        }
      }

      if (S.tab === "stars") {
        if (!main.querySelector(".collection-bar")) {
          const first = main.querySelector(".panel");
          if (first) first.insertAdjacentHTML("beforebegin", pityHTML(S) + collectionHTML(S, hook));
        }
      }
    };

    const origRelease = hook.releaseProject;
    hook.releaseProject = function (slot) {
      origRelease(slot);
      const S = hook.getState();
      checkNearMiss(S, hook);
      tryAutoGreenlight(S, hook);
    };

    const origTick = hook.tick;
    if (origTick) {
      hook.tick = function (seconds) {
        origTick(seconds);
        const S = hook.getState();
        const mps = merchPerSec(S);
        if (mps > 0) S.yen += mps * seconds;
      };
    }

    document.addEventListener("click", (e) => {
      const t = e.target.closest("[data-plus-goal],[data-plus-smartcast],[data-plus-autogl],[data-plus-freelance],[data-plus-settings],[data-merch-buy],[data-rival-claim],[data-collection-bonus],[data-settings-close],[data-settings-motion],[data-settings-ticker],[data-settings-autogl]");
      if (!t) return;
      const S = hook.getState();
      if (t.dataset.plusGoal != null) return claimDailyGoal(+t.dataset.plusGoal);
      if (t.dataset.plusSmartcast != null) return smartCast(S, hook);
      if (t.dataset.plusAutogl != null) {
        S.autoGreenlight = !S.autoGreenlight;
        hook.toast(S.autoGreenlight ? "⚡ Auto-Greenlight ON" : "Auto-Greenlight off");
        hook.save();
        hook.render();
        return;
      }
      if (t.dataset.plusFreelance != null) return hook.freelance?.();
      if (t.dataset.plusSettings != null) return openSettings();
      if (t.dataset.merchBuy != null) return buyMerch(+t.dataset.merchBuy);
      if (t.dataset.rivalClaim != null) return claimRival();
      if (t.dataset.collectionBonus != null) return claimCollectionBonus();
      if (t.dataset.settingsClose != null) return closeSettings();
      if (t.dataset.settingsMotion != null) {
        S.settings = S.settings || {};
        S.settings.motion = t.checked;
        hook.save();
        applySettings(S);
        return;
      }
      if (t.dataset.settingsTicker != null) {
        S.settings = S.settings || {};
        S.settings.ticker = t.checked;
        hook.save();
        applySettings(S);
        return;
      }
      if (t.dataset.settingsAutogl != null) {
        S.autoGreenlight = t.checked;
        hook.save();
        return;
      }
    });

    const S = hook.getState();
    S.settings = S.settings || { motion: true, ticker: true };
    ensureDailyGoals(S);
    applySettings(S);

    const tr = document.getElementById("trendbar");
    if (tr && !document.getElementById("trend-forecast")) {
      tr.insertAdjacentHTML("beforeend", ' <span id="trend-forecast"></span>');
    }

    return true;
  }

  const poll = setInterval(() => {
    if (installHooks()) clearInterval(poll);
  }, 80);
})();