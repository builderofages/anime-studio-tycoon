/**
 * Anime Studio Tycoon — Final expansion (v8 · 100%)
 * OST commissions, streaming contracts, Influence currency, troubled-production recovery,
 * post-crisis recap cards, scroll preservation, guided energy/chaos/casting tutorial.
 */
(function () {
  const OST_HYPE = 6;
  const OST_MAX = 3;
  const RECOVERY_CLICKS = 8;
  const RECOVERY_WINDOW_MS = 10000;

  const STREAMING = [
    { id: "regional", ic: "📺", name: "Regional Streamer", cost: 5000, boost: 0.06, days: 7 },
    { id: "global", ic: "🌐", name: "Global Platform", cost: 28000, boost: 0.14, days: 14 },
    { id: "animepass", ic: "🎟️", name: "Anime Pass Bundle", cost: 95000, boost: 0.26, days: 21 },
  ];

  const INFLUENCE_PERKS = [
    { k: "income", ic: "💰", name: "Industry Clout", desc: "+3% all income", max: 5, costs: [3, 5, 8, 12, 18] },
    { k: "premiere", ic: "⭐", name: "Critics Guild", desc: "+4% premiere rating", max: 3, costs: [5, 8, 12] },
    { k: "chaos", ic: "🛡️", name: "Crisis Network", desc: "−8% chaos event severity", max: 3, costs: [4, 7, 10] },
  ];

  const GUIDE_STEPS = [
    { ic: "⚡", title: "Star Energy", body: "Featured cast lose energy each premiere. Rest them on the Stars tab or they'll underperform. Legendaries hit harder but tire faster." },
    { ic: "🌪️", title: "Chaos & War Room", body: "High chaos triggers War Room crises — pick your response wisely. Buy insurance on Produce, keep calm streaks for bonus gems." },
    { ic: "🎭", title: "Smart Casting", body: "Match star roles to project needs. Friends on the same show boost output; rivals clash. Polish & OST passes stack premiere rewards." },
  ];

  let scrollByTab = {};
  let recoveryState = null;
  let lastCrises = 0;
  let pendingRecap = null;

  function todayStr() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function dayAdd(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function initState(S) {
    S.influence = S.influence || 0;
    S.influenceSpent = S.influenceSpent || 0;
    S.inflPerks = S.inflPerks || { income: 0, premiere: 0, chaos: 0 };
    S.streaming = S.streaming || [];
    S.recoveryCd = S.recoveryCd || {};
    S.finalGuideSeen = S.finalGuideSeen != null ? S.finalGuideSeen : false;
    S.finalGuideStep = S.finalGuideStep || 0;
    S.ostTotal = S.ostTotal || 0;
    S.recoveries = S.recoveries || 0;
  }

  function inflAvailable(S) {
    return Math.max(0, (S.influence || 0) - (S.influenceSpent || 0));
  }

  function activeStreamBoost(S) {
    const now = todayStr();
    let b = 0;
    for (const c of S.streaming || []) {
      if (c.until >= now) b += c.boost || 0;
    }
    return b;
  }

  function pruneStreaming(S) {
    const now = todayStr();
    S.streaming = (S.streaming || []).filter((c) => c.until >= now);
  }

  function earnInfluence(S, n, reason, h) {
    if (!n) return;
    S.influence = (S.influence || 0) + n;
    if (reason) h.toast("🎖️ +" + n + " Influence · " + reason, true);
  }

  function incomeInflMult(S) {
    return 1 + (S.inflPerks?.income || 0) * 0.03;
  }

  function premiereInflAdj(S) {
    return 1 + (S.inflPerks?.premiere || 0) * 0.04;
  }

  function setupGuideModal() {
    if (document.getElementById("final-guide")) return;
    const el = document.createElement("div");
    el.id = "final-guide";
    el.className = "overlay";
    el.style.display = "none";
    el.innerHTML = `<div class="card-modal" style="max-width:400px;text-align:left">
      <div id="final-guide-ic" style="font-size:42px;text-align:center"></div>
      <h2 id="final-guide-title" style="text-align:center;margin:8px 0"></h2>
      <p id="final-guide-body" class="muted" style="font-size:14px;line-height:1.5"></p>
      <div class="muted" style="text-align:center;font-size:11px;margin-top:8px" id="final-guide-dots"></div>
      <button class="btn-primary" data-final-guide-next style="width:100%;margin-top:14px">Next ▶</button>
    </div>`;
    document.body.appendChild(el);
  }

  function setupRecapModal() {
    if (document.getElementById("crisis-recap")) return;
    const el = document.createElement("div");
    el.id = "crisis-recap";
    el.className = "overlay";
    el.style.display = "none";
    el.innerHTML = `<div class="card-modal crisis-recap-card" style="max-width:380px">
      <div id="crisis-recap-ic" style="font-size:48px;text-align:center"></div>
      <h2 id="crisis-recap-title" style="text-align:center;margin:6px 0"></h2>
      <p id="crisis-recap-body" class="muted" style="font-size:13px;text-align:center"></p>
      <div class="recap-stats" id="crisis-recap-stats"></div>
      <button class="btn-gold" data-final-recap-close style="width:100%;margin-top:14px">Back to the lot ▶</button>
    </div>`;
    document.body.appendChild(el);
  }

  function setupRecoveryModal() {
    if (document.getElementById("recovery-game")) return;
    const el = document.createElement("div");
    el.id = "recovery-game";
    el.className = "overlay";
    el.style.display = "none";
    el.innerHTML = `<div class="card-modal" style="max-width:360px;text-align:center">
      <div style="font-size:42px">🚑</div>
      <h2 style="margin:6px 0">Troubled Production</h2>
      <p class="muted" style="font-size:13px">Rally the team — tap fast!</p>
      <div class="recovery-bar"><div class="recovery-fill" id="recovery-fill"></div></div>
      <div class="recovery-count" id="recovery-count">0 / ${RECOVERY_CLICKS}</div>
      <button class="btn-cyan recovery-tap" data-final-recovery-tap style="width:100%;margin-top:12px;font-size:18px;padding:14px">💪 Rally!</button>
      <button class="btn-ghost" data-final-recovery-cancel style="width:100%;margin-top:8px">Give up</button>
    </div>`;
    document.body.appendChild(el);
  }

  function showGuide(step, h) {
    setupGuideModal();
    const g = GUIDE_STEPS[step];
    if (!g) return;
    document.getElementById("final-guide-ic").textContent = g.ic;
    document.getElementById("final-guide-title").textContent = g.title;
    document.getElementById("final-guide-body").textContent = g.body;
    document.getElementById("final-guide-dots").textContent = "Tip " + (step + 1) + " of " + GUIDE_STEPS.length;
    document.getElementById("final-guide").style.display = "flex";
  }

  function showRecap(data, S, h) {
    setupRecapModal();
    document.getElementById("crisis-recap-ic").textContent = data.ic || "⚠️";
    document.getElementById("crisis-recap-title").textContent = data.title || "Crisis Resolved";
    document.getElementById("crisis-recap-body").textContent = data.msg || "Your studio weathered the storm.";
    document.getElementById("crisis-recap-stats").innerHTML = `
      <div class="recap-stat"><span>Crises survived</span><b>${S.crisesSurvived || 0}</b></div>
      <div class="recap-stat"><span>Calm streak</span><b>${S.calmStreak || 0} days</b></div>
      <div class="recap-stat"><span>Market share</span><b>${S.marketShare || 5}%</b></div>`;
    document.getElementById("crisis-recap").style.display = "flex";
    h.play("reward");
  }

  function commissionOst(slot, h) {
    const S = h.getState();
    const pr = S.projects[slot];
    if (!pr) return;
    const p = h.getProject(pr.pid);
    if (pr.progress >= p.work) { h.toast("Premiere first — OST is for active productions"); return; }
    pr.ost = pr.ost || 0;
    if (pr.ost >= OST_MAX) { h.toast("OST already maxed for this show"); return; }
    if (S.hype < OST_HYPE) { h.toast("Need " + OST_HYPE + " Hype for OST commission"); return; }
    S.hype -= OST_HYPE;
    pr.ost++;
    S.ostTotal = (S.ostTotal || 0) + 1;
    h.toast("🎵 Theme song commissioned! OST ×" + pr.ost + " — premiere boost locked in", true);
    h.play("click");
    h.save();
    h.render();
    if (pr.ost >= 3) { try { if (window.STEAM_ACHIEVE) window.STEAM_ACHIEVE("ost3"); } catch (e) {} }
  }

  function signStream(id, h) {
    const S = h.getState();
    pruneStreaming(S);
    const deal = STREAMING.find((d) => d.id === id);
    if (!deal) return;
    if (S.yen < deal.cost) { h.toast("Need ¥" + h.fmt(deal.cost)); return; }
    const dup = (S.streaming || []).find((c) => c.id === id && c.until >= todayStr());
    if (dup) { h.toast("Contract already active — wait for renewal"); return; }
    S.yen -= deal.cost;
    S.streaming.push({ id: deal.id, name: deal.name, boost: deal.boost, until: dayAdd(deal.days) });
    earnInfluence(S, 1, "streaming deal signed", h);
    h.toast(deal.ic + " " + deal.name + " · +" + Math.round(deal.boost * 100) + "% royalties for " + deal.days + "d", true);
    try { if (window.STEAM_ACHIEVE) window.STEAM_ACHIEVE("stream1"); } catch (e) {}
    h.play("reward");
    h.save();
    h.render();
  }

  function buyInflPerk(k, h) {
    const S = h.getState();
    const def = INFLUENCE_PERKS.find((p) => p.k === k);
    if (!def) return;
    const lvl = S.inflPerks[k] || 0;
    if (lvl >= def.max) { h.toast(def.name + " maxed"); return; }
    const cost = def.costs[lvl];
    if (inflAvailable(S) < cost) { h.toast("Need " + cost + " Influence (earn from crises & deals)"); return; }
    S.influenceSpent = (S.influenceSpent || 0) + cost;
    S.inflPerks[k] = lvl + 1;
    h.toast("🎖️ " + def.name + " Lv " + (lvl + 1) + " unlocked!", true);
    if (inflAvailable(S) === 0 && (S.influence || 0) >= 10) { try { if (window.STEAM_ACHIEVE) window.STEAM_ACHIEVE("influence10"); } catch (e) {} }
    h.play("reward");
    h.save();
    h.render();
  }

  function startRecovery(slot, h) {
    const S = h.getState();
    const pr = S.projects[slot];
    if (!pr) return;
    const cd = S.recoveryCd[slot] || 0;
    if (Date.now() < cd) { h.toast("Recovery cooling down…"); return; }
    recoveryState = { slot, clicks: 0, deadline: Date.now() + RECOVERY_WINDOW_MS, timer: null };
    setupRecoveryModal();
    document.getElementById("recovery-count").textContent = "0 / " + RECOVERY_CLICKS;
    document.getElementById("recovery-fill").style.width = "0%";
    document.getElementById("recovery-game").style.display = "flex";
    recoveryState.timer = setInterval(() => {
      if (!recoveryState) return;
      const left = Math.max(0, recoveryState.deadline - Date.now());
      document.getElementById("recovery-fill").style.width = (left / RECOVERY_WINDOW_MS * 100) + "%";
      if (left <= 0) endRecovery(false, h);
    }, 80);
    h.play("click");
  }

  function endRecovery(success, h) {
    if (!recoveryState) return;
    const slot = recoveryState.slot;
    clearInterval(recoveryState.timer);
    document.getElementById("recovery-game").style.display = "none";
    const S = h.getState();
    const pr = S.projects[slot];
    if (success && pr) {
      const p = h.getProject(pr.pid);
      pr.progress = Math.min(p.work, pr.progress + p.work * 0.2);
      S.chaos = Math.max(0, (S.chaos || 0) - 15);
      S.recoveries = (S.recoveries || 0) + 1;
      S.recoveryCd[slot] = Date.now() + 300000;
      h.toast("🚑 Production recovered! +20% progress · chaos eased", true);
      if (S.recoveries >= 5) { try { if (window.STEAM_ACHIEVE) window.STEAM_ACHIEVE("recover5"); } catch (e) {} }
      h.play("reward");
      h.save();
      h.render();
    } else {
      S.recoveryCd[slot] = Date.now() + 120000;
      h.toast("Rally failed — team needs a breather");
    }
    recoveryState = null;
  }

  function recoveryTap(h) {
    if (!recoveryState) return;
    recoveryState.clicks++;
    document.getElementById("recovery-count").textContent = recoveryState.clicks + " / " + RECOVERY_CLICKS;
    if (recoveryState.clicks >= RECOVERY_CLICKS) endRecovery(true, h);
  }

  function troubledSlot(pr, S, p) {
    if (!pr || pr.progress >= p.work) return false;
    const frac = pr.progress / p.work;
    return (S.chaos || 0) > 42 && frac > 0.15 && frac < 0.85;
  }

  function injectProduceExtras(S, h) {
    if (S.tab !== "produce") return;
    S.projects.forEach((pr, i) => {
      if (!pr) return;
      const p = h.getProject(pr.pid);
      const panel = document.getElementById("slot-" + i);
      if (!panel) return;
      if (!panel.querySelector("[data-final-ost]") && pr.progress < p.work) {
        const row = panel.querySelector(".row");
        if (row) {
          const ost = pr.ost || 0;
          row.insertAdjacentHTML("beforeend",
            `<button class="btn-ghost ost-btn" data-final-ost="${i}" ${S.hype >= OST_HYPE && ost < OST_MAX ? "" : "disabled"}>🎵 OST (${OST_HYPE}⚡)${ost ? " ·×" + ost : ""}</button>`);
        }
      }
      if (!panel.querySelector("[data-final-recovery]") && troubledSlot(pr, S, p)) {
        const row = panel.querySelector(".row");
        if (row) {
          const cd = S.recoveryCd[i] || 0;
          row.insertAdjacentHTML("beforeend",
            `<button class="btn-cyan recovery-btn" data-final-recovery="${i}" ${Date.now() >= cd ? "" : "disabled"}>🚑 Rally Team</button>`);
        }
      }
    });
  }

  function injectStudioInfluence(S, h) {
    if (S.tab !== "studio") return;
    const main = document.getElementById("main");
    if (!main || main.querySelector(".influence-panel")) return;
    pruneStreaming(S);
    const avail = inflAvailable(S);
    const perks = INFLUENCE_PERKS.map((p) => {
      const lvl = S.inflPerks[p.k] || 0;
      const cost = lvl < p.max ? p.costs[lvl] : null;
      return `<div class="infl-perk">
        <div><b>${p.ic} ${p.name}</b> <span class="pill">Lv ${lvl}/${p.max}</span></div>
        <div class="muted" style="font-size:11px">${p.desc}</div>
        ${cost != null ? `<button class="btn-cyan hirebtn" data-final-infl="${p.k}" ${avail >= cost ? "" : "disabled"} style="margin-top:6px;font-size:11px">${cost} 🎖️</button>` : `<span class="pill" style="margin-top:6px;display:inline-block">MAX</span>`}
      </div>`;
    }).join("");
    const streams = STREAMING.map((d) => {
      const active = (S.streaming || []).find((c) => c.id === d.id && c.until >= todayStr());
      return `<button class="btn-ghost hirebtn stream-deal" data-final-stream="${d.id}" ${active || S.yen < d.cost ? "disabled" : ""} style="font-size:11px;text-align:left">
        ${d.ic} ${d.name}<small>¥${h.fmt(d.cost)} · +${Math.round(d.boost * 100)}% · ${d.days}d${active ? " · ACTIVE" : ""}</small></button>`;
    }).join("");
    const active = (S.streaming || []).filter((c) => c.until >= todayStr());
    main.insertAdjacentHTML("afterbegin", `<div class="panel influence-panel">
      <h2>🎖️ Influence <span class="pill">${avail} available</span></h2>
      <div class="muted" style="font-size:12px;margin-bottom:10px">Second prestige currency — survives reboots. Earn from crises, streaming deals & industry standing.</div>
      <div class="infl-perks">${perks}</div>
      <h3 style="margin:14px 0 8px;font-size:14px">📡 Streaming Contracts</h3>
      <div class="muted" style="font-size:11px;margin-bottom:8px">Boost back-catalog royalties while active.</div>
      <div class="stream-grid">${streams}</div>
      ${active.length ? `<div class="stream-active">Live: ${active.map((c) => c.name + " → " + c.until).join(" · ")}</div>` : ""}
    </div>`);
  }

  function maybeShowGuide(S, h) {
    if (S.finalGuideSeen || !S.tutorialSeen) return;
    if (S.finalGuideStep < GUIDE_STEPS.length) showGuide(S.finalGuideStep, h);
  }

  function installHooks() {
    const hook = window.__AST_HOOK__;
    if (!hook || hook.__finalInstalled) return false;
    hook.__finalInstalled = true;

    setupGuideModal();
    setupRecapModal();
    setupRecoveryModal();

    const S0 = hook.getState();
    initState(S0);
    lastCrises = S0.crisesSurvived || 0;

    const origRelease = hook.releaseProject;
    hook.releaseProject = function (slot) {
      const S = hook.getState();
      const pr = S.projects[slot];
      if (pr) {
        let m = incomeInflMult(S);
        let star = premiereInflAdj(S);
        if (pr.ost) {
          m *= 1 + Math.min(0.18, pr.ost * 0.06);
          star *= 1 + Math.min(0.15, pr.ost * 0.05);
        }
        S._finalReleaseMult = m;
        S._finalStarAdj = star;
      }
      const rel0 = S.releases || 0;
      origRelease(slot);
      if ((S.releases || 0) > rel0 && (S.releases % 10 === 0)) earnInfluence(S, 1, "10 premieres milestone", hook);
      delete S._finalReleaseMult;
      delete S._finalStarAdj;
    };

    const origTick = hook.tick;
    if (origTick) {
      hook.tick = function (seconds) {
        origTick(seconds);
        const S = hook.getState();
        initState(S);
        const boost = activeStreamBoost(S);
        if (boost > 0 && (S.catalogIncome || 0) > 0) {
          S.yen += Math.floor(S.catalogIncome * boost * seconds * incomeInflMult(S));
        }
        if ((S.crisesSurvived || 0) > lastCrises) {
          const delta = S.crisesSurvived - lastCrises;
          earnInfluence(S, delta, "crisis handled", hook);
          if (pendingRecap) showRecap(pendingRecap, S, hook);
          lastCrises = S.crisesSurvived;
        }
        const ms = S.marketShare || 5;
        S._inflMilestones = S._inflMilestones || {};
        for (const t of [15, 25, 35, 50]) {
          if (ms >= t && !S._inflMilestones[t]) {
            S._inflMilestones[t] = true;
            earnInfluence(S, 2, t + "% market share", hook);
          }
        }
      };
    }

    const origRender = hook.render;
    hook.render = function () {
      const S = hook.getState();
      initState(S);
      const main = document.getElementById("main");
      const tab = S.tab;
      if (main) scrollByTab[tab] = main.scrollTop;
      origRender();
      if (!document.documentElement.classList.contains("hud-v3-active")) {
        injectProduceExtras(S, hook);
        injectStudioInfluence(S, hook);
        maybeShowGuide(S, hook);
      }
      if (main && scrollByTab[tab] != null) {
        requestAnimationFrame(() => { main.scrollTop = scrollByTab[tab]; });
      }
    };

    document.addEventListener("click", (e) => {
      const t = e.target.closest("[data-final-ost],[data-final-recovery],[data-final-stream],[data-final-infl],[data-final-guide-next],[data-final-recap-close],[data-final-recovery-tap],[data-final-recovery-cancel]");
      if (!t) return;
      const S = hook.getState();
      if (t.dataset.finalOst != null) return commissionOst(+t.dataset.finalOst, hook);
      if (t.dataset.finalRecovery != null && t.dataset.finalRecoveryTap == null) return startRecovery(+t.dataset.finalRecovery, hook);
      if (t.dataset.finalRecoveryTap != null) return recoveryTap(hook);
      if (t.dataset.finalRecoveryCancel != null) return endRecovery(false, hook);
      if (t.dataset.finalStream) return signStream(t.dataset.finalStream, hook);
      if (t.dataset.finalInfl) return buyInflPerk(t.dataset.finalInfl, hook);
      if (t.dataset.finalRecapClose != null) {
        document.getElementById("crisis-recap").style.display = "none";
        pendingRecap = null;
        return;
      }
      if (t.dataset.finalGuideNext != null) {
        S.finalGuideStep = (S.finalGuideStep || 0) + 1;
        if (S.finalGuideStep >= GUIDE_STEPS.length) {
          S.finalGuideSeen = true;
          document.getElementById("final-guide").style.display = "none";
        } else showGuide(S.finalGuideStep, hook);
        hook.save();
        return;
      }
    });

    document.addEventListener("click", (e) => {
      const war = e.target.closest("[data-empire-war]");
      if (!war) return;
      const d = window.__AST_PENDING_WARROOM__;
      if (!d) return;
      const idx = +war.dataset.empireWar;
      const opt = d.opts && d.opts[idx];
      pendingRecap = {
        ic: d.ic,
        title: d.title + " — Recap",
        msg: opt ? "You chose: " + opt.label.replace(/^[^\s]+\s/, "") : "Crisis contained.",
      };
    }, true);

    const origChaos = window.__AST_MAYBE_CHAOS__;
    if (origChaos) {
      window.__AST_MAYBE_CHAOS__ = function (fallback) {
        const S = hook.getState();
        const reduce = 1 - (S.inflPerks?.chaos || 0) * 0.08;
        const c0 = S.chaos;
        S.chaos = Math.floor((S.chaos || 0) * reduce);
        origChaos(fallback);
        S.chaos = c0;
      };
    }

    setTimeout(() => {
      const S = hook.getState();
      if (S.tutorialSeen && !S.finalGuideSeen && S.finalGuideStep < GUIDE_STEPS.length) {
        setTimeout(() => maybeShowGuide(S, hook), 800);
      }
    }, 1200);

    return true;
  }

  const poll = setInterval(() => {
    if (installHooks()) clearInterval(poll);
  }, 80);
})();