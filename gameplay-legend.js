/**
 * Anime Studio Tycoon — Legend expansion (v10)
 * Dynasty perks shop, career ledger, rival festivals, rank-up ceremonies,
 * achievement dynasty rewards, expanded executive briefings.
 */
(function () {
  const RIVALS = ["Kyoto Frame Works", "Neo Sakura Pictures", "Atlas Animation", "Midnight Toon Co.", "Pixel Ronin Studios"];
  const FESTIVALS = [
    { id: "annecy", ic: "🎞️", name: "Annecy Animation Festival", minStars: 4, gems: 5, dynasty: 8 },
    { id: "crunchy", ic: "🏆", name: "Crunchyroll Anime Awards", minStars: 4, gems: 8, dynasty: 12 },
    { id: "japan", ic: "🇯🇵", name: "Japan Anime Grand Prix", minStars: 5, gems: 15, dynasty: 20 },
  ];

  const DYNASTY_PERKS = [
    { k: "income", ic: "💰", name: "Studio Empire", desc: "+3% all income per level", max: 5, costs: [12, 20, 32, 48, 70] },
    { k: "premiere", ic: "⭐", name: "Critics Circle", desc: "+2% premiere stars per level", max: 4, costs: [15, 25, 40, 60] },
    { k: "festival", ic: "🏆", name: "Festival Prestige", desc: "+8% festival win chance per level", max: 3, costs: [18, 30, 45] },
  ];

  const EXTRA_BRIEFINGS = [
    {
      title: "Investor Call — Capital allocation",
      opts: [
        { label: "🏗️ Expand lots — next slot unlock −15% fan cost", fn: (S) => { S.legendSlotDiscount = (S.legendSlotDiscount || 0) + 1; return "Slot expansion subsidized"; } },
        { label: "📚 Catalog push — boost back-catalog royalties", fn: (S, h) => { const b = Math.max(20, Math.floor((S.catalogIncome || 0) * 0.15)); S.catalogIncome = (S.catalogIncome || 0) + b; return "+¥" + h.fmt(b) + "/s royalties"; } },
        { label: "🎖️ Dynasty PR — +5 dynasty points", fn: (S) => { S.dynastyPoints = (S.dynastyPoints || 0) + 5; return "+5 dynasty points"; } },
      ],
    },
    {
      title: "Creative Summit — What defines us?",
      opts: [
        { label: "🎨 Art-first — next premiere +10% stars", fn: (S) => { S.aaaQualityBoost = (S.aaaQualityBoost || 0) + 2; return "Art-first mandate active"; } },
        { label: "📈 Franchise focus — +1 random franchise season", fn: (S) => { const fr = Object.keys(S.franchises || {}); if (fr.length) { const f = fr[Math.floor(Math.random() * fr.length)]; S.franchises[f] = (S.franchises[f] || 1) + 1; return f + " season +" + S.franchises[f]; } S.hype += 15; return "+15 Hype (no franchise yet)"; } },
        { label: "🤝 Rival truce — +12 Influence", fn: (S, h) => { S.influence = (S.influence || 0) + 12; return "+12 Influence"; } },
      ],
    },
  ];

  function todayStr() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function initState(S) {
    S.dynastyPerks = S.dynastyPerks || { income: 0, premiere: 0, festival: 0 };
    S.dynastySpent = S.dynastySpent || 0;
    S.peakDynasty = S.peakDynasty || 0;
    S.dynastyRankUps = S.dynastyRankUps || [];
    S.festivalLosses = S.festivalLosses || 0;
    S.legendSlotDiscount = S.legendSlotDiscount || 0;
    S.careerYen = S.careerYen || 0;
    S.careerFans = S.careerFans || 0;
  }

  function dynastyScore(S) {
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
    if (score >= 92) return "S";
    if (score >= 78) return "A";
    if (score >= 62) return "B";
    if (score >= 45) return "C";
    return "D";
  }

  function dynastyAvailable(S) {
    return Math.max(0, (S.dynastyPoints || 0) - (S.dynastySpent || 0));
  }

  function perkCost(k, S) {
    const def = DYNASTY_PERKS.find((p) => p.k === k);
    if (!def) return 999;
    const lvl = (S.dynastyPerks || {})[k] || 0;
    return def.costs[lvl] || 999;
  }

  function buyDynastyPerk(k, h) {
    const S = h.getState();
    initState(S);
    const def = DYNASTY_PERKS.find((p) => p.k === k);
    if (!def) return;
    const lvl = (S.dynastyPerks || {})[k] || 0;
    if (lvl >= def.max) { h.toast("Max level reached"); return; }
    const cost = perkCost(k, S);
    if (dynastyAvailable(S) < cost) { h.toast("Need " + cost + " dynasty points"); return; }
    S.dynastySpent = (S.dynastySpent || 0) + cost;
    S.dynastyPerks[k] = lvl + 1;
    h.toast(def.ic + " " + def.name + " Lv " + S.dynastyPerks[k] + "!", true);
    h.play("reward");
    h.save();
    h.render();
    try { if (window.STEAM_ACHIEVE) window.STEAM_ACHIEVE("dynperk1"); } catch (e) {}
  }

  function festivalWinChance(S) {
    let c = 0.55;
    c += ((S.dynastyPerks || {}).festival || 0) * 0.08;
    if ((S.festivalWins || []).length >= 3) c += 0.05;
    return Math.min(0.85, c);
  }

  function tryFestivalWithRival(pr, p, stars, S, h) {
    if (stars < 4 || !pr || !p) return;
    const eligible = FESTIVALS.filter((f) => stars >= f.minStars);
    const fest = eligible[Math.floor(Math.random() * eligible.length)];
    if (!fest) return;
    const key = fest.id + ":" + (pr.title || p.name);
    if ((S.festivalWins || []).some((w) => w.key === key)) return;
    if (Math.random() > festivalWinChance(S)) {
      S.festivalLosses = (S.festivalLosses || 0) + 1;
      const rival = RIVALS[Math.floor(Math.random() * RIVALS.length)];
      S.dynastyPoints = (S.dynastyPoints || 0) + 2;
      S.hype = Math.min(100, (S.hype || 0) + 4);
      h.toast("🥈 " + fest.name + " — runner-up to " + rival + ". +2 dynasty, +4⚡", true);
      return;
    }
    S.festivalWins = S.festivalWins || [];
    S.festivalWins.push({ key, fest: fest.name, ic: fest.ic, stars, title: pr.title || p.name, t: Date.now() });
    S.gems += fest.gems;
    S.dynastyPoints = (S.dynastyPoints || 0) + fest.dynasty;
    h.toast(fest.ic + " " + fest.name + " — WON! +" + fest.gems + "💎 +" + fest.dynasty + " dynasty", true);
    try { if (window.STEAM_ACHIEVE) window.STEAM_ACHIEVE("festival1"); } catch (e) {}
  }

  function checkRankUp(S, h) {
    const score = dynastyScore(S);
    const grade = dynastyGrade(score);
    if (score > (S.peakDynasty || 0)) S.peakDynasty = score;
    const milestones = [
      { g: "B", min: 62, msg: "📈 B-RANK RISING — industry is watching!" },
      { g: "A", min: 78, msg: "🔥 A-RANK ELITE — you're a top-tier studio!" },
      { g: "S", min: 92, msg: "👑 S-TIER LEGEND — anime history will remember you!" },
    ];
    for (const m of milestones) {
      if (score >= m.min && !(S.dynastyRankUps || []).includes(m.g)) {
        S.dynastyRankUps.push(m.g);
        S.dynastyPoints = (S.dynastyPoints || 0) + (m.g === "S" ? 25 : m.g === "A" ? 15 : 8);
        S.gems += m.g === "S" ? 20 : m.g === "A" ? 10 : 5;
        h.toast(m.msg + " +" + (m.g === "S" ? 25 : m.g === "A" ? 15 : 8) + " dynasty", true);
        h.play("reward");
        try { if (window.STEAM_ACHIEVE && m.g === "S") window.STEAM_ACHIEVE("dynastyS"); } catch (e) {}
      }
    }
  }

  function totalStarCareerYen(S) {
    let t = 0;
    for (const sid in S.starStats || {}) t += (S.starStats[sid].yen || 0);
    return t;
  }

  function injectStudioLegend(S, h) {
    if (S.tab !== "studio") return;
    const main = document.getElementById("main");
    if (!main) return;

    if (!main.querySelector(".legend-perks")) {
      const rows = DYNASTY_PERKS.map((p) => {
        const lvl = (S.dynastyPerks || {})[p.k] || 0;
        const cost = perkCost(p.k, S);
        const maxed = lvl >= p.max;
        return `<div class="uprow legend-perk-row">
          <div class="meta"><h4 style="font-size:13px">${p.ic} ${p.name} <span class="muted">Lv ${lvl}/${p.max}</span></h4>
          <div class="muted" style="font-size:11px">${p.desc}</div></div>
          <button class="btn-gold hirebtn" data-legend-perk="${p.k}" ${maxed ? "disabled" : ""} style="font-size:11px;min-width:88px">${maxed ? "MAX" : cost + " pts"}</button>
        </div>`;
      }).join("");
      main.insertAdjacentHTML("beforeend", `<div class="panel legend-glass legend-perks">
        <h2>👑 Dynasty Perks</h2>
        <div class="muted" style="font-size:11px;margin-bottom:8px">Spend dynasty points on permanent studio upgrades. Available: <b>${dynastyAvailable(S)}</b> / ${S.dynastyPoints || 0} earned</div>
        ${rows}
      </div>`);
    } else {
      const avail = main.querySelector(".legend-perks .muted b");
      if (avail) avail.textContent = String(dynastyAvailable(S));
      DYNASTY_PERKS.forEach((p) => {
        const btn = main.querySelector(`[data-legend-perk="${p.k}"]`);
        if (!btn) return;
        const lvl = (S.dynastyPerks || {})[p.k] || 0;
        const maxed = lvl >= p.max;
        btn.disabled = maxed;
        btn.textContent = maxed ? "MAX" : perkCost(p.k, S) + " pts";
        const meta = btn.closest(".legend-perk-row");
        if (meta) {
          const span = meta.querySelector("h4 span");
          if (span) span.textContent = "Lv " + lvl + "/" + p.max;
        }
      });
    }

    if (!main.querySelector(".legend-ledger")) {
      const score = dynastyScore(S);
      const grade = dynastyGrade(score);
      const starYen = totalStarCareerYen(S);
      main.insertAdjacentHTML("beforeend", `<div class="panel legend-glass legend-ledger">
        <h2>📜 Career Ledger</h2>
        <div class="ledger-grid">
          <div class="ledger-cell"><span class="ledger-val">${grade}</span><span class="ledger-lbl">Current Rank</span></div>
          <div class="ledger-cell"><span class="ledger-val">${S.peakDynasty || score}</span><span class="ledger-lbl">Peak Dynasty</span></div>
          <div class="ledger-cell"><span class="ledger-val">${(S.festivalWins || []).length}</span><span class="ledger-lbl">Festivals Won</span></div>
          <div class="ledger-cell"><span class="ledger-val">${S.festivalLosses || 0}</span><span class="ledger-lbl">Runner-Ups</span></div>
          <div class="ledger-cell"><span class="ledger-val">${S.contractsSigned || 0}</span><span class="ledger-lbl">Contracts</span></div>
          <div class="ledger-cell"><span class="ledger-val">${(S.directorsCuts || []).length}</span><span class="ledger-lbl">Director's Cuts</span></div>
          <div class="ledger-cell"><span class="ledger-val">¥${h.fmt(starYen)}</span><span class="ledger-lbl">Star Box Office</span></div>
          <div class="ledger-cell"><span class="ledger-val">${S.careerYen ? "¥" + h.fmt(S.careerYen) : "—"}</span><span class="ledger-lbl">Career Revenue</span></div>
        </div>
      </div>`);
    } else {
      const score = dynastyScore(S);
      const grade = dynastyGrade(score);
      const cells = main.querySelectorAll(".legend-ledger .ledger-cell");
      const vals = [grade, S.peakDynasty || score, (S.festivalWins || []).length, S.festivalLosses || 0,
        S.contractsSigned || 0, (S.directorsCuts || []).length, "¥" + h.fmt(totalStarCareerYen(S)),
        S.careerYen ? "¥" + h.fmt(S.careerYen) : "—"];
      cells.forEach((c, i) => { const v = c.querySelector(".ledger-val"); if (v && vals[i] != null) v.textContent = vals[i]; });
    }
  }

  function injectProduceLegend(S, h) {
    if (S.tab !== "produce") return;
    const dash = [...document.querySelectorAll("#main .panel")].find((p) => p.textContent.includes("Studio Lv"));
    if (!dash) return;
    if (!dash.querySelector(".legend-dynasty-bar")) {
      const avail = dynastyAvailable(S);
      dash.insertAdjacentHTML("beforeend",
        `<div class="legend-dynasty-bar muted" style="font-size:11px;margin-top:6px">👑 <b>${avail}</b> dynasty points available · <span data-legend-goto-perks style="color:var(--sakura);cursor:pointer;font-weight:800">Open Perks →</span></div>`);
    } else {
      const b = dash.querySelector(".legend-dynasty-bar b");
      if (b) b.textContent = String(dynastyAvailable(S));
    }
  }

  function patchBriefings() {
    if (window.__AST_AAA_BRIEF_POOL__) return;
    window.__AST_AAA_BRIEF_POOL__ = EXTRA_BRIEFINGS;
  }

  function installHooks() {
    const hook = window.__AST_HOOK__;
    if (!hook || hook.__legendInstalled) return false;
    hook.__legendInstalled = true;
    window.__LEGEND_FESTIVAL__ = true;
    patchBriefings();

    const S0 = hook.getState();
    initState(S0);

    const origRelease = hook.releaseProject;
    hook.releaseProject = function (slot) {
      const S = hook.getState();
      initState(S);
      const pr = S.projects[slot];
      let starsAt = 0;
      let pRef = null;
      const perks = S.dynastyPerks || {};
      S._legendReleaseMult = 1 + (perks.income || 0) * 0.03;
      S._legendStarAdj = 1 + (perks.premiere || 0) * 0.02;
      if (pr) {
        pRef = hook.getProject(pr.pid);
        starsAt = hook.projectStars ? hook.projectStars(pRef, pr.genre, pr) : 3;
      }
      const yen0 = S.yen;
      const fans0 = S.fans;
      const rel0 = S.releases || 0;
      origRelease(slot);
      if (pr && (S.releases || 0) > rel0) {
        S.careerYen = (S.careerYen || 0) + (S.yen - yen0);
        S.careerFans = (S.careerFans || 0) + (S.fans - fans0);
        tryFestivalWithRival(pr, pRef, starsAt, S, hook);
        checkRankUp(S, hook);
      }
      delete S._legendReleaseMult;
      delete S._legendStarAdj;
    };

    const origTick = hook.tick;
    if (origTick) {
      hook.tick = function (seconds) {
        const S = hook.getState();
        initState(S);
        const perks = S.dynastyPerks || {};
        if ((perks.income || 0) > 0 && (S.catalogIncome || 0) > 0) {
          S._legendTickRoyaltyBoost = (perks.income || 0) * 0.03;
        }
        origTick(seconds);
        delete S._legendTickRoyaltyBoost;
      };
    }

    const origRender = hook.render;
    hook.render = function () {
      const S = hook.getState();
      initState(S);
      origRender();
      injectProduceLegend(S, hook);
      injectStudioLegend(S, hook);
    };

    document.addEventListener("click", (e) => {
      const t = e.target.closest("[data-legend-perk],[data-legend-goto-perks]");
      if (!t) return;
      if (t.dataset.legendGotoPerks != null) {
        const S = hook.getState();
        S.tab = "studio";
        hook.render();
        return;
      }
      if (t.dataset.legendPerk) return buyDynastyPerk(t.dataset.legendPerk, hook);
    });

    const achCheck = window.checkAchievements;
    if (typeof achCheck === "function" && !window.__LEGEND_ACH__) {
      window.__LEGEND_ACH__ = true;
      window.checkAchievements = function () {
        const before = (hook.getState().achievements || []).length;
        achCheck();
        const after = (hook.getState().achievements || []).length;
        if (after > before) {
          const S = hook.getState();
          const gained = after - before;
          S.dynastyPoints = (S.dynastyPoints || 0) + gained * 3;
          hook.save();
        }
      };
    }

    return true;
  }

  const poll = setInterval(() => {
    if (installHooks()) clearInterval(poll);
  }, 80);
})();