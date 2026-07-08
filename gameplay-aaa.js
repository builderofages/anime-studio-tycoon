/**
 * Anime Studio Tycoon — AAA S-Tier expansion (v9)
 * Dynasty score, director's briefing, festival circuit, star contracts & lifetime stats,
 * mentor bonuses, smart cast, auto-rest, cancel production, director's cut, syndication,
 * achievement cinematics, franchise universe, nightmare tracker.
 */
(function () {
  const FESTIVALS = [
    { id: "annecy", ic: "🎞️", name: "Annecy Animation Festival", minStars: 4, gems: 5, dynasty: 8 },
    { id: "crunchy", ic: "🏆", name: "Crunchyroll Anime Awards", minStars: 4, gems: 8, dynasty: 12 },
    { id: "japan", ic: "🇯🇵", name: "Japan Anime Grand Prix", minStars: 5, gems: 15, dynasty: 20 },
  ];

  const BRIEFINGS = [
    {
      title: "Morning Strategy — Board Meeting",
      opts: [
        { label: "🎯 Focus quality — next premiere +8% rating", fn: (S) => { S.aaaQualityBoost = (S.aaaQualityBoost || 0) + 1; return "Quality focus active today"; } },
        { label: "💰 Commercial push — +12% Yen on premieres", fn: (S) => { S.aaaYenBoost = (S.aaaYenBoost || 0) + 1; return "Commercial mode engaged"; } },
        { label: "🌟 Talent day — all stars +15 energy", fn: (S) => { (S.stars || []).forEach((st) => { st.energy = Math.min(100, (st.energy || 80) + 15); }); return "Stars refreshed"; } },
      ],
    },
    {
      title: "Industry Pulse — What matters today?",
      opts: [
        { label: "📣 Marketing blitz — +20 Hype", fn: (S) => { S.hype += 20; return "+20 Hype"; } },
        { label: "🧘 Calm the lot — −25 Chaos", fn: (S) => { S.chaos = Math.max(0, (S.chaos || 0) - 25); return "Chaos eased"; } },
        { label: "🔬 R&D sprint — random genre +1 mastery", fn: (S, h) => { const g = h.GENRES[Math.floor(Math.random() * h.GENRES.length)]; S.mastery[g] = (S.mastery[g] || 0) + 1; return g + " mastery +1"; } },
      ],
    },
    {
      title: "Talent Relations — Star morale check",
      opts: [
        { label: "💚 Loyalty gifts — all stars +10 loyalty", fn: (S) => { (S.stars || []).forEach((st) => { st.loyalty = Math.min(100, (st.loyalty || 80) + 10); }); return "Loyalty boosted"; } },
        { label: "⚡ Bench recovery — resting stars full energy", fn: (S) => { (S.stars || []).filter((st) => st.resting).forEach((st) => { st.energy = 100; }); return "Benched stars recharged"; } },
        { label: "📋 Sign contracts — offer deals to top 3 stars", fn: (S, h) => { offerContractsTop(S, h, 3); return "Contract offers sent"; } },
      ],
    },
  ];

  const CONTRACT_SHOWS = 3;
  const CONTRACT_BONUS = 1.12;

  function todayStr() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function initState(S) {
    S.starStats = S.starStats || {};
    S.starContracts = S.starContracts || {};
    S.festivalWins = S.festivalWins || [];
    S.directorsCuts = S.directorsCuts || [];
    S.aaaQualityBoost = S.aaaQualityBoost || 0;
    S.aaaYenBoost = S.aaaYenBoost || 0;
    S.autoRest = S.autoRest != null ? S.autoRest : false;
    S.dynastyPoints = S.dynastyPoints || 0;
    S.syndicationUntil = S.syndicationUntil || "";
    S.briefingDay = S.briefingDay || "";
    S.briefingPending = S.briefingPending || "";
    S.contractsSigned = S.contractsSigned || 0;
  }

  function dynastyScore(S, h) {
    let s = 0;
    s += Math.min(18, (S.releases || 0) / 15);
    s += Math.min(15, Math.log10(Math.max(1, S.totalFansEver || 1)) * 3);
    s += Math.min(12, (S.marketShare || 5) / 4);
    s += Math.min(10, (S.awardsWon || 0) * 2);
    s += Math.min(10, (S.festivalWins || []).length * 2.5);
    s += Math.min(8, (S.legacy || 0) * 1.5);
    s += Math.min(8, (S.influence || 0) / 3);
    s += Math.min(7, (S.stars || []).length / 2);
    s += Math.min(6, Object.keys(S.franchises || {}).length);
    s += Math.min(6, (S.dynastyPoints || 0) / 20);
    if (S.producerPass) s += 4;
    if ((S.endlessDiff || "") === "nightmare") s += 5;
    return Math.round(Math.min(100, s));
  }

  function dynastyGrade(score) {
    if (score >= 92) return { g: "S", cls: "dynasty-s", label: "S-TIER LEGEND" };
    if (score >= 78) return { g: "A", cls: "dynasty-a", label: "A-TIER ELITE" };
    if (score >= 62) return { g: "B", cls: "dynasty-b", label: "B-TIER RISING" };
    if (score >= 45) return { g: "C", cls: "dynasty-c", label: "C-TIER INDIE" };
    return { g: "D", cls: "dynasty-d", label: "D-TIER GARAGE" };
  }

  function offerContractsTop(S, h, n) {
    const stars = [...(S.stars || [])].sort((a, b) => (b.level || 1) - (a.level || 1)).slice(0, n);
    stars.forEach((st) => {
      if (!S.starContracts[st.sid]) {
        S.starContracts[st.sid] = { shows: CONTRACT_SHOWS, signed: todayStr() };
        S.contractsSigned = (S.contractsSigned || 0) + 1;
        st.loyalty = Math.min(100, (st.loyalty || 80) + 15);
      }
    });
  }

  function mentorMult(cast, h) {
    if (!cast || cast.length < 2 || !h) return 1;
    const stars = cast.map((id) => h.STAR_BY_ID[id]).filter(Boolean);
    const legs = stars.filter((t) => t.rarity === "Legendary");
    const rookies = cast.filter((id) => {
      const st = (h.getState().stars || []).find((s) => s.sid === id);
      return st && (st.level || 1) <= 3;
    });
    if (legs.length && rookies.length) return 1.1;
    return 1;
  }

  function contractMult(cast, S) {
    if (!cast) return 1;
    let m = 1;
    cast.forEach((id) => {
      const c = S.starContracts && S.starContracts[id];
      if (c && c.shows > 0) m *= CONTRACT_BONUS;
    });
    return Math.min(1.35, m);
  }

  function recordStarStats(S, pr, stars, yen) {
    S.starStats = S.starStats || {};
    (pr.cast || []).forEach((sid) => {
      const st = S.starStats[sid] || { shows: 0, best: 0, yen: 0 };
      st.shows++;
      st.best = Math.max(st.best, stars);
      st.yen += yen || 0;
      S.starStats[sid] = st;
      const c = S.starContracts[sid];
      if (c && c.shows > 0) c.shows--;
      if (c && c.shows <= 0) delete S.starContracts[sid];
    });
  }

  function tryFestivalSubmit(pr, p, stars, S, h) {
    if (stars < 4) return;
    const eligible = FESTIVALS.filter((f) => stars >= f.minStars);
    const fest = eligible[Math.floor(Math.random() * eligible.length)];
    if (!fest) return;
    const key = fest.id + ":" + (pr.title || p.name);
    if ((S.festivalWins || []).some((w) => w.key === key)) return;
    if (Math.random() > 0.55) return;
    S.festivalWins.push({ key, fest: fest.name, ic: fest.ic, stars, title: pr.title || p.name, t: Date.now() });
    S.gems += fest.gems;
    S.dynastyPoints = (S.dynastyPoints || 0) + fest.dynasty;
    h.toast(fest.ic + " " + fest.name + " — WON! +" + fest.gems + "💎", true);
    try { if (window.STEAM_ACHIEVE) window.STEAM_ACHIEVE("festival1"); } catch (e) {}
  }

  function smartCast(h) {
    const S = h.getState();
    const cap = h.castCap ? h.castCap() : 3;
    const roster = (S.stars || [])
      .map((st) => ({ st, t: h.STAR_BY_ID[st.sid] }))
      .filter((x) => x.t && !x.st.resting && (x.st.energy || 80) >= 20)
      .sort((a, b) => {
        const order = ["Legendary", "Epic", "Rare", "Common"];
        return order.indexOf(h.effRarity(b.st)) - order.indexOf(h.effRarity(a.st)) || (b.st.level || 1) - (a.st.level || 1);
      });
    const pick = roster.slice(0, cap).map((x) => x.st.sid);
    h.setCastSel(pick);
    h.toast("🎭 Smart Cast: " + pick.length + " stars ready", true);
    h.render();
  }

  function cancelProduction(slot, h) {
    const S = h.getState();
    const pr = S.projects[slot];
    if (!pr) return;
    const p = h.getProject(pr.pid);
    if (pr.progress >= p.work) { h.toast("Already complete — release instead"); return; }
    const refund = Math.floor(p.cost * 0.6 * (1 - pr.progress / p.work));
    S.yen += refund;
    S.projects[slot] = null;
    S.chaos = Math.max(0, (S.chaos || 0) - 5);
    h.toast("🛑 Production cancelled · ¥" + h.fmt(refund) + " refunded", true);
    h.save();
    h.render();
  }

  function directorsCut(title, h) {
    const S = h.getState();
    S.directorsCuts = S.directorsCuts || [];
    if (S.directorsCuts.includes(title)) { h.toast("Already re-released"); return; }
    const hit = (S.hallOfFame || []).find((x) => x.title === title);
    if (!hit) return;
    if (S.hype < 8) { h.toast("Need 8 Hype for Director's Cut"); return; }
    S.hype -= 8;
    S.directorsCuts.push(title);
    const boost = Math.max(50, Math.floor((hit.yen || 1000) * 0.08));
    S.catalogIncome = (S.catalogIncome || 0) + boost;
    S.dynastyPoints = (S.dynastyPoints || 0) + 5;
    h.toast("🎬 Director's Cut: \"" + title + "\" — +¥" + h.fmt(boost) + "/s royalties", true);
    h.play("reward");
    h.save();
    h.render();
    try { if (window.STEAM_ACHIEVE) window.STEAM_ACHIEVE("directors1"); } catch (e) {}
  }

  function signSyndication(h) {
    const S = h.getState();
    if ((S.totalFansEver || 0) < 100000) { h.toast("Need 100K lifetime fans for Global Syndication"); return; }
    if (S.syndicationUntil >= todayStr()) { h.toast("Syndication already active"); return; }
    const cost = Math.floor(h.studioValue() * 0.08);
    if (S.yen < cost) { h.toast("Need ¥" + h.fmt(cost)); return; }
    S.yen -= cost;
    const d = new Date();
    d.setDate(d.getDate() + 21);
    S.syndicationUntil = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    h.toast("🌍 Global Syndication — +25% all income for 21 days!", true);
    h.play("reward");
    h.save();
    h.render();
    try { if (window.STEAM_ACHIEVE) window.STEAM_ACHIEVE("syndication1"); } catch (e) {}
  }

  function syndicationMult(S) {
    return S.syndicationUntil && S.syndicationUntil >= todayStr() ? 1.25 : 1;
  }

  function setupBriefingModal() {
    if (document.getElementById("aaa-briefing")) return;
    const el = document.createElement("div");
    el.id = "aaa-briefing";
    el.className = "overlay";
    el.style.display = "none";
    el.innerHTML = `<div class="card-modal briefing-card" style="max-width:400px;text-align:left">
      <h2 id="aaa-briefing-title" style="margin:6px 0;font-size:18px"></h2>
      <p class="muted" style="font-size:13px">Your executive team needs a call. Effects last until tomorrow.</p>
      <div id="aaa-briefing-opts"></div>
    </div>`;
    document.body.appendChild(el);
  }

  function setupAchievePop() {
    if (document.getElementById("aaa-achieve-pop")) return;
    const el = document.createElement("div");
    el.id = "aaa-achieve-pop";
    el.className = "achieve-pop";
    document.body.appendChild(el);
  }

  function showBriefing(b, h) {
    setupBriefingModal();
    document.getElementById("aaa-briefing-title").textContent = b.title;
    document.getElementById("aaa-briefing-opts").innerHTML = b.opts.map((o, i) =>
      `<button class="briefing-opt" data-aaa-brief="${i}">${o.label}</button>`
    ).join("");
    window.__AST_AAA_BRIEF__ = b;
    document.getElementById("aaa-briefing").style.display = "flex";
  }

  function showAchievePop(name, gems) {
    setupAchievePop();
    const el = document.getElementById("aaa-achieve-pop");
    el.textContent = "🏆 " + name + (gems ? " +" + gems + " 💎" : "");
    el.classList.add("show");
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove("show"), 3200);
  }

  function injectProduceAAA(S, h) {
    if (S.tab !== "produce") return;
    const dash = [...document.querySelectorAll("#main .panel")].find((p) => p.textContent.includes("Studio Lv"));
    if (dash) {
      const score = dynastyScore(S, h);
      const dg = dynastyGrade(score);
      const nightmare = (S.endlessDiff || "") === "nightmare" ? " · ☠️ NIGHTMARE" : "";
      let badge = dash.querySelector(".dynasty-badge");
      const inner = `${dg.g}-RANK · ${dg.label} <span style="opacity:.85">(${score}/100)</span>${nightmare}`;
      if (badge) {
        badge.className = "dynasty-badge " + dg.cls;
        badge.innerHTML = inner;
      } else {
        const h2 = dash.querySelector("h2");
        if (h2) {
          h2.insertAdjacentHTML("afterend", `<div class="dynasty-badge ${dg.cls}">${inner}</div>`);
        }
      }
    }
    const green = [...document.querySelectorAll("#main .panel")].find((p) => p.textContent.includes("Greenlight"));
    if (green && !green.querySelector(".smart-cast-bar")) {
      const castLine = green.querySelector(".genrepick");
      if (castLine) {
        castLine.insertAdjacentHTML("beforebegin",
          `<div class="smart-cast-bar">
            <button class="btn-cyan hirebtn" data-aaa-smart-cast style="font-size:11px">🎭 Smart Cast</button>
            <button class="btn-ghost hirebtn" data-aaa-auto-rest-toggle style="font-size:11px">${S.autoRest ? "✅ Auto-Rest ON" : "💤 Auto-Rest OFF"}</button>
          </div>`);
      }
    }
    S.projects.forEach((pr, i) => {
      if (!pr) return;
      const panel = document.getElementById("slot-" + i);
      if (!panel) return;
      const p = h.getProject(pr.pid);
      if (pr.progress >= p.work) panel.classList.add("slot-ready");
      else panel.classList.remove("slot-ready");
      if (!panel.querySelector("[data-aaa-cancel]") && pr.progress < p.work * 0.95) {
        const row = panel.querySelector(".row");
        if (row) row.insertAdjacentHTML("beforeend",
          `<button class="btn-ghost" data-aaa-cancel="${i}" style="font-size:10px;width:100%;margin-top:4px">🛑 Cancel (60% refund)</button>`);
      }
    });
    if ((S.festivalWins || []).length && dash) {
      const recent = S.festivalWins.slice(-3).reverse().map((w) =>
        `<div class="festival-row">${w.ic} <b>${w.fest}</b> — "${w.title}" ${"★".repeat(w.stars)}</div>`
      ).join("");
      let fw = dash.querySelector(".festival-wins");
      const html = `<div class="muted" style="font-weight:800;margin-top:10px">🏆 Festival Circuit</div>${recent}`;
      if (fw) fw.innerHTML = html;
      else dash.insertAdjacentHTML("beforeend", `<div class="festival-wins">${html}</div>`);
    }
    const fr = Object.keys(S.franchises || {});
    if (fr.length && dash) {
      const nodes = fr.slice(0, 6).map((f) =>
        `<div class="franchise-node">📺 <b>${f}</b> · Season ${S.franchises[f]} · franchise bonus active</div>`
      ).join("");
      let fu = dash.querySelector(".franchise-universe");
      const html = `<div class="muted" style="font-weight:800">🌌 Franchise Universe</div>${nodes}`;
      if (fu) fu.innerHTML = html;
      else dash.insertAdjacentHTML("beforeend", `<div class="franchise-universe">${html}</div>`);
    }
  }

  function injectStarsAAA(S, h) {
    if (S.tab !== "stars") return;
    (S.stars || []).forEach((st) => {
      const t = h.STAR_BY_ID[st.sid];
      if (!t) return;
      const row = [...document.querySelectorAll(".staffrow")].find((r) => r.textContent.includes(t.name.split(" ")[0]));
      if (!row || row.querySelector(".aaa-lifetime")) return;
      const stats = (S.starStats || {})[st.sid] || { shows: 0, best: 0, yen: 0 };
      const contract = S.starContracts && S.starContracts[st.sid];
      const contractTag = contract ? `<span class="contract-chip">📋 Contract · ${contract.shows} shows left</span>` : "";
      const meta = row.querySelector(".meta");
      if (meta) {
        meta.insertAdjacentHTML("beforeend",
          `<div class="aaa-lifetime muted" style="font-size:10px;margin-top:4px">📊 ${stats.shows} shows · best ${"★".repeat(stats.best || 0)} · ¥${h.fmt(stats.yen)} ${contractTag}</div>`);
      }
    });
  }

  function injectStudioAAA(S, h) {
    if (S.tab !== "studio") return;
    const main = document.getElementById("main");
    if (!main || main.querySelector(".aaa-syndication")) return;
    const syndActive = S.syndicationUntil >= todayStr();
    main.insertAdjacentHTML("afterbegin", `<div class="panel aaa-glass aaa-syndication">
      <h2>🌍 Global Syndication</h2>
      <div class="muted" style="font-size:12px;margin-bottom:8px">Endgame mega-deal: +25% all income for 21 days. Requires 100K lifetime fans.</div>
      ${syndActive ? `<div class="pill" style="display:inline-block">ACTIVE until ${S.syndicationUntil}</div>` :
        `<button class="btn-gold" data-aaa-syndication style="width:100%">Sign Syndication · ¥${h.fmt(Math.floor(h.studioValue() * 0.08))}</button>`}
    </div>`);
    const hof = (S.hallOfFame || []).slice(0, 5);
    if (hof.length && !main.querySelector(".aaa-directors")) {
      const rows = hof.map((x) => {
        const done = (S.directorsCuts || []).includes(x.title);
        return `<div class="uprow"><div class="meta"><h4 style="font-size:13px">"${x.title}"</h4><div class="muted">${"★".repeat(x.stars)} · ¥${h.fmt(x.yen)}</div></div>
          <button class="btn-ghost hirebtn" data-aaa-directors="${encodeURIComponent(x.title)}" ${done ? "disabled" : ""} style="font-size:11px">${done ? "✓ Cut" : "🎬 Director's Cut"}</button></div>`;
      }).join("");
      main.insertAdjacentHTML("beforeend", `<div class="panel aaa-directors"><h2>🎬 Director's Cuts</h2>
        <div class="muted" style="font-size:11px;margin-bottom:8px">Re-release a hall-of-fame hit for permanent royalty boost (8⚡ each).</div>${rows}</div>`);
    }
  }

  function maybeBriefing(S, h) {
    const day = todayStr();
    if (S.briefingDay === day) return;
    if ((S.releases || 0) < 3) return;
    if (S.briefingPending === day) return;
    S.briefingPending = day;
    const pool = BRIEFINGS.concat(window.__AST_AAA_BRIEF_POOL__ || []);
    const b = pool[Math.floor(Math.random() * pool.length)];
    setTimeout(() => showBriefing(b, h), 1200);
  }

  function installHooks() {
    const hook = window.__AST_HOOK__;
    if (!hook || hook.__aaaLayerInstalled) return false;
    hook.__aaaLayerInstalled = true;

    setupBriefingModal();
    setupAchievePop();
    const S0 = hook.getState();
    initState(S0);

    const origRelease = hook.releaseProject;
    hook.releaseProject = function (slot) {
      const S = hook.getState();
      initState(S);
      const pr = S.projects[slot];
      let starsAtRelease = 0;
      let pRef = null;
      if (pr) {
        pRef = hook.getProject(pr.pid);
        let m = mentorMult(pr.cast, hook) * contractMult(pr.cast, S) * syndicationMult(S);
        if (S.aaaYenBoost) m *= 1.12;
        S._aaaReleaseMult = m;
        const qa = 1 + Math.min(0.12, (S.aaaQualityBoost || 0) * 0.04);
        S._aaaStarAdj = qa;
        starsAtRelease = hook.projectStars ? hook.projectStars(pRef, pr.genre, pr) : 3;
      }
      const yen0 = S.yen;
      const rel0 = S.releases || 0;
      origRelease(slot);
      if (pr && (S.releases || 0) > rel0) {
        const yenGain = S.yen - yen0;
        recordStarStats(S, pr, starsAtRelease, yenGain);
        if (!window.__LEGEND_FESTIVAL__) tryFestivalSubmit(pr, pRef, starsAtRelease, S, hook);
      }
      delete S._aaaReleaseMult;
      delete S._aaaStarAdj;
      if (S.briefingDay !== todayStr()) {
        S.aaaQualityBoost = 0;
        S.aaaYenBoost = 0;
      }
    };

    const origTick = hook.tick;
    if (origTick) {
      hook.tick = function (seconds) {
        const S = hook.getState();
        initState(S);
        const synM = syndicationMult(S);
        if (synM > 1 && (S.catalogIncome || 0) > 0) {
          S._aaaTickRoyaltyBoost = synM - 1;
        }
        origTick(seconds);
        delete S._aaaTickRoyaltyBoost;
        if (S.autoRest) {
          (S.stars || []).forEach((st) => {
            if ((st.energy || 100) < 25 && !st.resting) st.resting = true;
            if ((st.energy || 0) >= 95 && st.resting) st.resting = false;
          });
        }
      };
    }

    const origRender = hook.render;
    hook.render = function () {
      const S = hook.getState();
      initState(S);
      origRender();
      if (document.documentElement.classList.contains("hud-v3-active")) return;
      injectProduceAAA(S, hook);
      injectStarsAAA(S, hook);
      injectStudioAAA(S, hook);
      maybeBriefing(S, hook);
    };

    document.addEventListener("click", (e) => {
      const t = e.target.closest("[data-aaa-smart-cast],[data-aaa-auto-rest-toggle],[data-aaa-cancel],[data-aaa-brief],[data-aaa-syndication],[data-aaa-directors]");
      if (!t) return;
      const S = hook.getState();
      if (t.dataset.aaaSmartCast != null) return smartCast(hook);
      if (t.dataset.aaaAutoRestToggle != null) {
        S.autoRest = !S.autoRest;
        hook.toast(S.autoRest ? "💤 Auto-Rest enabled" : "Auto-Rest disabled");
        hook.save();
        hook.render();
        return;
      }
      if (t.dataset.aaaCancel != null) return cancelProduction(+t.dataset.aaaCancel, hook);
      if (t.dataset.aaaSyndication != null) return signSyndication(hook);
      if (t.dataset.aaaDirectors) return directorsCut(decodeURIComponent(t.dataset.aaaDirectors), hook);
      if (t.dataset.aaaBrief != null) {
        const b = window.__AST_AAA_BRIEF__;
        const opt = b && b.opts[+t.dataset.aaaBrief];
        if (opt) {
          S.briefingDay = todayStr();
          const msg = opt.fn(S, hook);
          hook.toast("📋 " + msg, true);
          hook.save();
        }
        document.getElementById("aaa-briefing").style.display = "none";
        hook.render();
        return;
      }
    });

    /* Core checkAchievements (index.html) owns achievement popups via window.showAchievePop */

    return true;
  }

  const poll = setInterval(() => {
    if (installHooks()) clearInterval(poll);
  }, 80);
})();