/**
 * Anime Studio Tycoon — Ultra expansion
 * Multi-stage production minigame, rival bidding, market share, full settings, gem confirm.
 */
(function () {
  const STAGES = ["📝 Pre-Pro", "🎨 Animate", "✂️ Post", "🎬 Polish"];
  const BID_LOTS = [
    { id: "manga", ic: "📚", name: "Manga License", share: 2, mult: 1 },
    { id: "stream", ic: "📺", name: "Streaming Rights", share: 3, mult: 1.4 },
    { id: "theater", ic: "🎥", name: "Theatrical Window", share: 4, mult: 1.8 },
    { id: "merch", ic: "🧸", name: "Global Merch Deal", share: 2, mult: 1.2 },
    { id: "star", ic: "⭐", name: "Star Exclusivity", share: 3, mult: 2 },
  ];

  let pendingGemCb = null;

  function weekKey() {
    const d = new Date();
    const onejan = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil(((d - onejan) / 86400000 + onejan.getDay() + 1) / 7);
    return d.getFullYear() + "-W" + week;
  }

  function stageIndex(pr, p) {
    if (!pr || !p) return 0;
    const pct = pr.progress / p.work;
    if (pct >= 1) return 3;
    return Math.min(3, Math.floor(pct * 4));
  }

  function ensureBid(S, hook) {
    S.bidWeek = S.bidWeek || "";
    S.bidsWon = S.bidsWon || 0;
    S.marketShare = S.marketShare == null ? 5 : S.marketShare;
    if (S.bidWeek !== weekKey() || !S.activeBid) {
      const st = hook.industryStandings();
      const rivals = st.all.filter((r) => !r.me);
      const rival = rivals[Math.floor(Math.random() * rivals.length)] || { name: "Neon Mirage" };
      const lot = BID_LOTS[Math.floor(Math.random() * BID_LOTS.length)];
      const base = Math.max(2000, Math.floor(hook.studioValue() * 0.08 * lot.mult));
      S.bidWeek = weekKey();
      S.activeBid = {
        lot: lot.id,
        rival: rival.name,
        cost: base,
        rivalBid: Math.floor(base * (0.75 + Math.random() * 0.35)),
        share: lot.share,
        expires: Date.now() + 7 * 86400000,
      };
      S.bidResolved = false;
    }
  }

  function marketShareHTML(S, hook) {
    ensureBid(S, hook);
    const pct = Math.min(99, Math.max(1, S.marketShare || 5));
    const incomeBonus = (pct * 0.15).toFixed(1);
    const st = hook.industryStandings();
    let ladder = st.all.slice(0, 6).map((r) => {
      const w = Math.min(100, Math.round((r.val / (st.all[0]?.val || 1)) * 100));
      return `<div class="rl-row"><span style="min-width:100px;${r.me ? "color:var(--sakura)" : ""}">${r.me ? "⭐ " : ""}${r.name.slice(0, 14)}</span><div class="rl-bar"><i style="width:${w}%"></i></div></div>`;
    }).join("");
    return `<div class="panel market-dash" id="market-dash">
      <h2>📊 Market Share Dashboard</h2>
      <div class="market-share-ring">
        <div class="ring" style="--pct:${pct}"><span>${pct}%</span></div>
        <div><b>Global market share</b><div class="muted" style="font-size:12px">+${incomeBonus}% income on all premieres<br>${S.bidsWon || 0} bidding wars won</div></div>
      </div>
      <div class="rival-ladder">${ladder}</div>
    </div>`;
  }

  function bidHTML(S, hook) {
    ensureBid(S, hook);
    const b = S.activeBid;
    if (!b || S.bidResolved) return "";
    const lot = BID_LOTS.find((l) => l.id === b.lot) || BID_LOTS[0];
    const left = Math.max(0, Math.ceil((b.expires - Date.now()) / 3600000));
    return `<div class="panel" id="bid-panel"><h2>⚔️ Bidding War</h2>
      <div class="bid-card active">
        <div class="bid-rival">vs ${b.rival}</div>
        <h4 style="margin:6px 0">${lot.ic} ${lot.name}</h4>
        <div class="muted" style="font-size:12px">Win → +${b.share}% market share · +fans</div>
        <div class="muted bid-timer">⏳ ${left}h left this week</div>
        <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn-gold hirebtn" data-ultra-bid="match" ${S.yen >= b.cost ? "" : "disabled"}>Bid ¥${hook.fmt(b.cost)}</button>
          <button class="btn-ghost hirebtn" data-ultra-bid="low">Lowball ¥${hook.fmt(Math.floor(b.cost * 0.6))}</button>
          <button class="btn-ghost hirebtn" data-ultra-bid="pass">Pass</button>
        </div>
        <div class="muted" style="font-size:10px;margin-top:4px">Rival's bid ~¥${hook.fmt(b.rivalBid)}</div>
      </div></div>`;
  }

  function resolveBid(S, hook, mode) {
    const b = S.activeBid;
    if (!b || S.bidResolved) return;
    S.bidResolved = true;
    if (mode === "pass") {
      hook.toast("Passed on the bid — rival gains ground");
      S.marketShare = Math.max(1, (S.marketShare || 5) - 1);
      hook.save();
      hook.render();
      return;
    }
    const pay = mode === "low" ? Math.floor(b.cost * 0.6) : b.cost;
    if (S.yen < pay) {
      hook.toast("Not enough ¥ to bid");
      S.bidResolved = false;
      return;
    }
    S.yen -= pay;
    const win = pay >= b.rivalBid * (mode === "low" ? 0.95 : 1);
    if (win) {
      S.marketShare = Math.min(99, (S.marketShare || 5) + b.share);
      S.bidsWon = (S.bidsWon || 0) + 1;
      const fans = Math.floor(b.share * 80 + pay / 500);
      S.fans += fans;
      S.totalFansEver += fans;
      hook.toast(`⚔️ Won ${BID_LOTS.find((l) => l.id === b.lot)?.name}! +${b.share}% share`, true);
      try { if (window.STEAM_ACHIEVE) window.STEAM_ACHIEVE("bid1"); } catch (e) {}
    } else {
      S.marketShare = Math.max(1, (S.marketShare || 5) - 1);
      hook.toast(`${b.rival} outbid you — market share −1%`);
    }
    hook.play("reward");
    hook.save();
    hook.render();
  }

  function stageMinigameHTML(slot, pr, p, S, hook) {
    const idx = stageIndex(pr, p);
    const pct = Math.round((pr.progress / p.work) * 100);
    const canBoost = pr.progress < p.work && S.hype >= 3;
    const pipes = STAGES.map((s, i) =>
      `<div class="sp ${i < idx ? "done" : i === idx ? "cur" : ""}">${s}</div>`
    ).join("");
    return `<div class="stage-minigame" data-ultra-slot="${slot}">
      <div class="sg-head"><span>🎮 Production Pipeline</span><span>${pct}%</span></div>
      <div class="stage-pipeline">${pipes}</div>
      <button class="btn-cyan" data-ultra-boost="${slot}" style="width:100%;font-size:12px;padding:8px" ${canBoost ? "" : "disabled"}>⚡ Rush Stage (3 Hype) · +12% progress</button>
    </div>`;
  }

  function injectStageMinigames(S, hook) {
    S.projects.forEach((pr, i) => {
      if (!pr) return;
      const p = hook.getProject(pr.pid);
      const panel = document.getElementById("slot-" + i);
      if (!panel || panel.querySelector(".stage-minigame")) return;
      const card = panel.querySelector(".card");
      if (card) card.insertAdjacentHTML("afterend", stageMinigameHTML(i, pr, p, S, hook));
    });
  }

  function stageBoost(slot, hook) {
    const S = hook.getState();
    const pr = S.projects[slot];
    if (!pr) return;
    const p = hook.getProject(pr.pid);
    if (pr.progress >= p.work) return;
    if (S.hype < 3) {
      hook.toast("Need 3 Hype to rush this stage");
      return;
    }
    S.hype -= 3;
    pr.progress = Math.min(p.work, pr.progress + p.work * 0.12);
    hook.toast("⚡ Stage rushed!", true);
    hook.play("click");
    questAddSafe(hook, "hypeSpent", 3);
    hook.save();
    hook.render();
  }

  function questAddSafe(hook, k, n) {
    const S = hook.getState();
    if (!S.questProg) S.questProg = {};
    S.questProg[k] = (S.questProg[k] || 0) + n;
  }

  function marketShareMult(S) {
    return 1 + ((S.marketShare || 5) * 0.0015);
  }

  /* ---- Gem confirm modal ---- */
  function setupConfirmModal() {
    if (document.getElementById("confirm-gem")) return;
    const el = document.createElement("div");
    el.id = "confirm-gem";
    el.className = "overlay";
    el.style.display = "none";
    el.innerHTML = `<div class="card-modal" style="max-width:360px">
      <div class="gem-preview">💎</div>
      <h2 id="confirm-gem-title" style="margin:4px 0">Spend Gems?</h2>
      <p id="confirm-gem-body" class="muted" style="font-size:13px"></p>
      <div class="row" style="gap:10px;margin-top:14px">
        <button class="btn-primary" data-ultra-confirm-yes style="flex:1">Confirm</button>
        <button class="btn-ghost" data-ultra-confirm-no style="flex:1">Cancel</button>
      </div></div>`;
    document.body.appendChild(el);
  }

  const GEM_LABELS = {
    hype: { cost: 5, label: "⚡ Hype Boost (+50 Hype)" },
    cash: { cost: 8, label: "💰 Cash Injection" },
    skip: { cost: 4, label: "⏭️ Skip All Productions" },
    golden: { cost: 12, label: "🌟 Golden Hour (3× income)" },
  };

  function showGemConfirm(act, cb) {
    const info = GEM_LABELS[act];
    if (!info) return cb();
    const S = window.__AST_HOOK__?.getState();
    if (S?.settings?.confirmGems === false) return cb();
    setupConfirmModal();
    const m = document.getElementById("confirm-gem");
    document.getElementById("confirm-gem-title").textContent = `Spend ${info.cost} 💎?`;
    document.getElementById("confirm-gem-body").textContent = info.label;
    pendingGemCb = cb;
    m.style.display = "flex";
  }

  function extendSettingsPanel() {
    const panel = document.getElementById("settings-panel");
    if (!panel || panel.querySelector("[data-ultra-music]")) return;
    const html = `
      <div class="setting-row"><span>🎵 Music volume</span><div class="settings-vol"><input type="range" min="0" max="100" data-ultra-music></div></div>
      <div class="setting-row"><span>🔊 SFX volume</span><div class="settings-vol"><input type="range" min="0" max="100" data-ultra-sfx></div></div>
      <div class="setting-row"><span>💎 Confirm gem spends</span><input type="checkbox" data-ultra-confirm-gems checked></div>`;
    const btn = panel.querySelector("[data-settings-close]");
    if (btn) btn.insertAdjacentHTML("beforebegin", html);
  }

  function syncSettingsUI(S) {
    extendSettingsPanel();
    const m = document.querySelector("[data-ultra-music]");
    const s = document.querySelector("[data-ultra-sfx]");
    const c = document.querySelector("[data-ultra-confirm-gems]");
    if (m) m.value = Math.round((S.settings?.musicVol ?? 0.35) * 100);
    if (s) s.value = Math.round((S.settings?.sfxVol ?? 0.5) * 100);
    if (c) c.checked = S.settings?.confirmGems !== false;
  }

  function installHooks() {
    const hook = window.__AST_HOOK__;
    if (!hook || hook.__ultraInstalled) return false;
    hook.__ultraInstalled = true;

    setupConfirmModal();
    extendSettingsPanel();

    window.__AST_CONFIRM_GEM__ = (act, cb) => {
      showGemConfirm(act, cb);
    };

    const origSpend = hook.spendGem;
    if (origSpend) {
      hook.spendGem = function (act, force) {
        if (!force) {
          showGemConfirm(act, () => origSpend(act, true));
          return;
        }
        origSpend(act, true);
      };
    }

    const origRelease = hook.releaseProject;
    hook.releaseProject = function (slot) {
      const S = hook.getState();
      const mult = marketShareMult(S);
      if (mult > 1.01) S._ultraShareMult = mult;
      origRelease(slot);
      delete S._ultraShareMult;
    };

    const origRender = hook.render;
    hook.render = function () {
      origRender();
      const S = hook.getState();
      syncSettingsUI(S);
      if (S.tab === "produce") {
        injectStageMinigames(S, hook);
        const main = document.getElementById("main");
        if (main && !main.querySelector("#bid-panel")) {
          const dash = main.querySelector("#market-dash");
          const anchor = dash || main.querySelector(".hero-card") || main.firstChild;
          if (anchor) anchor.insertAdjacentHTML("afterend", bidHTML(S, hook));
        }
      }
      if (S.tab === "market") {
        const main = document.getElementById("main");
        if (main && !main.querySelector("#market-dash")) {
          main.insertAdjacentHTML("afterbegin", marketShareHTML(S, hook) + bidHTML(S, hook));
        }
      }
    };

    document.addEventListener("click", (e) => {
      const t = e.target.closest("[data-ultra-boost],[data-ultra-bid],[data-ultra-confirm-yes],[data-ultra-confirm-no],[data-ultra-music],[data-ultra-sfx],[data-ultra-confirm-gems]");
      if (!t) return;
      const S = hook.getState();
      if (t.dataset.ultraBoost != null) return stageBoost(+t.dataset.ultraBoost, hook);
      if (t.dataset.ultraBid) return resolveBid(S, hook, t.dataset.ultraBid);
      if (t.dataset.ultraConfirmYes != null) {
        document.getElementById("confirm-gem").style.display = "none";
        if (pendingGemCb) { const cb = pendingGemCb; pendingGemCb = null; cb(); }
        return;
      }
      if (t.dataset.ultraConfirmNo != null) {
        document.getElementById("confirm-gem").style.display = "none";
        pendingGemCb = null;
        return;
      }
      if (t.dataset.ultraMusic != null) {
        S.settings = S.settings || {};
        S.settings.musicVol = +t.value / 100;
        hook.applyAudioSettings?.();
        hook.save();
        return;
      }
      if (t.dataset.ultraSfx != null) {
        S.settings = S.settings || {};
        S.settings.sfxVol = +t.value / 100;
        hook.applyAudioSettings?.();
        hook.save();
        return;
      }
      if (t.dataset.ultraConfirmGems != null) {
        S.settings = S.settings || {};
        S.settings.confirmGems = t.checked;
        hook.save();
        return;
      }
    });

    const S = hook.getState();
    S.settings = Object.assign({ musicVol: 0.35, sfxVol: 0.5, confirmGems: true, motion: true, ticker: true }, S.settings || {});
    hook.applyAudioSettings?.();
    return true;
  }

  const poll = setInterval(() => {
    if (installHooks()) clearInterval(poll);
  }, 80);
})();