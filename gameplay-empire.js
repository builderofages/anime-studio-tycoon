/**
 * Anime Studio Tycoon — Empire expansion (v6)
 * Named staff, war room crises, genre blend, source material, scout banner, chaos insurance, calm streak.
 */
(function () {
  const TRAITS = {
    fast: { ic: "⚡", name: "Fast", power: 1.15 },
    creative: { ic: "🎨", name: "Creative", power: 1.1, quality: 1.08 },
    steady: { ic: "🧘", name: "Steady", power: 1.05, morale: 1.2 },
    veteran: { ic: "🏅", name: "Veteran", power: 1.12 },
  };

  const NAMES = {
    animator: ["Mika Tanabe", "Jin Park", "Sora Ito", "Lena Cho", "Riku Amano"],
    writer: ["Nozomi Hayashi", "Ethan Cole", "Aya Mori", "Priya Shah", "Felix Berg"],
    director: ["Ken Watanabe", "Clara Weiss", "Hiro Saito", "Nadia Ortiz", "Tomo Ikeda"],
    voice: ["Yuki Nakamura", "Marcus Lee", "Ines Costa", "Dae Kim", "Ella Brooks"],
    producer: ["Rina Fujii", "Omar Hassan", "Chloe Martin", "Viktor Petrov", "Mei Lin"],
  };

  const SOURCES = [
    { id: "original", ic: "✨", name: "Original", fans: 1, yen: 1 },
    { id: "manga", ic: "📚", name: "Manga", fans: 1.15, yen: 0.95 },
    { id: "ln", ic: "📖", name: "Light Novel", fans: 1.08, yen: 1.05 },
  ];

  const WARROOM = [
    {
      id: "melt3", ic: "🔥", title: "Render Farm Meltdown — War Room",
      text: "Productions are stalling. Choose your response:",
      opts: [
        { label: "💰 Emergency repairs", fn: (S, h) => { const c = Math.floor(h.studioValue() * 0.04); if (S.yen < c) return "No funds."; S.yen -= applyIns(S, c); S.chaos = Math.max(0, (S.chaos || 0) - 40); return `−¥${h.fmt(applyIns(S, c))}, crisis contained`; } },
        { label: "⏸️ Pause one line", fn: (S) => { const i = S.projects.findIndex((p) => p); if (i < 0) return "No active line."; S.projects[i].progress *= 0.5; S.chaos = Math.max(0, (S.chaos || 0) - 20); return "One show set back 50%"; } },
        { label: "🌪️ Ride it out", fn: (S) => { S.projects.forEach((pr) => { if (pr) pr.progress *= 0.75; }); S.chaos = Math.max(0, (S.chaos || 0) - 10); return "All shows −25% progress"; } },
      ],
    },
    {
      id: "scandal3", ic: "📰", title: "Viral Scandal — War Room",
      text: "A rumor is trending. How do you respond?",
      opts: [
        { label: "📣 Full PR blitz", fn: (S, h) => { const c = Math.floor(h.studioValue() * 0.06); if (S.yen < c) return "Can't afford PR."; S.yen -= applyIns(S, c); S.chaos = Math.max(0, (S.chaos || 0) - 38); S.fans += 50; return `PR saved the day · +50 fans`; } },
        { label: "🎬 Drop a teaser", fn: (S, h) => { S.hype += 12; S.chaos = Math.max(0, (S.chaos || 0) - 18); return "+12 Hype, buzz redirected"; } },
        { label: "🙈 Ignore it", fn: (S, h) => { const f = Math.floor((S.fans || 0) * 0.05); S.fans = Math.max(0, S.fans - f); return `−${h.fmt(f)} fans`; } },
      ],
    },
    {
      id: "sabotage", ic: "🗡️", title: "Rival Sabotage",
      text: "A rival studio planted bad press. Counter-move?",
      opts: [
        { label: "⚔️ Counter-bid licenses", fn: (S, h) => { S.marketShare = Math.max(1, (S.marketShare || 5) - 2); S.chaos = Math.max(0, (S.chaos || 0) - 25); return "Lost 2% share but scandal dies down"; } },
        { label: "💎 Gem PR spin", fn: (S, h) => { if (S.gems < 3) return "Need 3 💎"; S.gems -= 3; S.chaos = Math.max(0, (S.chaos || 0) - 35); return "Spin doctors deployed"; } },
        { label: "📈 Lean into it", fn: (S, h) => { S.hype += 20; S.chaos = Math.min(100, (S.chaos || 0) + 8); return "+20 Hype but chaos rises"; } },
      ],
    },
  ];

  function weekKey() {
    const d = new Date();
    const onejan = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil(((d - onejan) / 86400000 + onejan.getDay() + 1) / 7);
    return d.getFullYear() + "-W" + week;
  }

  function todayStr() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function applyIns(S, cost) {
    if (!S.chaosInsurance) return cost;
    return Math.floor(cost * 0.55);
  }

  function ensureBanner(S, hook) {
    if (S.scoutBannerWeek === weekKey() && S.scoutBannerStar) return;
    const pool = hook.STAR_POOL.filter((s) => !s.exclusive && (s.rarity === "Epic" || s.rarity === "Legendary"));
    const star = pool[Math.floor(Math.random() * pool.length)] || hook.STAR_POOL[0];
    S.scoutBannerWeek = weekKey();
    S.scoutBannerStar = star.id;
    S.scoutBannerRate = 2.5;
  }

  function blendMult(pr) {
    if (!pr || !pr.genre2 || pr.genre2 === pr.genre) return 1;
    return 1.08;
  }

  function sourceMult(pr, type) {
    const src = SOURCES.find((s) => s.id === (pr && pr.source)) || SOURCES[0];
    return type === "fans" ? src.fans : src.yen;
  }

  function computeRoleBonus(S, h) {
    const bonus = { animator: 0, writer: 0, director: 0, voice: 0, producer: 0 };
    if (!h) return bonus;
    for (const ns of S.namedStaff || []) {
      const tr = TRAITS[ns.trait] || TRAITS.steady;
      const role = ns.role;
      const base = (h.ROLES[role]?.power || 2) * (ns.level || 1) * (tr.power || 1) * 0.35;
      bonus[role] = (bonus[role] || 0) + base;
    }
    return bonus;
  }

  let hook;

  function recruitNamed(role, h) {
    const S = h.getState();
    const pool = NAMES[role] || NAMES.animator;
    const used = new Set((S.namedStaff || []).map((n) => n.name));
    const avail = pool.filter((n) => !used.has(n));
    const name = avail[Math.floor(Math.random() * avail.length)] || pool[Math.floor(Math.random() * pool.length)];
    const traits = Object.keys(TRAITS);
    const trait = traits[Math.floor(Math.random() * traits.length)];
    const cost = Math.ceil(h.hireCost(role) * 2.2);
    if (S.yen < cost) {
      h.toast("Need ¥" + h.fmt(cost) + " to recruit " + name);
      return;
    }
    S.yen -= cost;
    S.staff[role] = (S.staff[role] || 0) + 1;
    S.namedStaff = S.namedStaff || [];
    S.namedStaff.push({ id: "ns_" + Date.now(), name, role, trait, morale: 85, level: 1, xp: 0 });
    if (S.namedStaff.length >= 5) { try { if (window.STEAM_ACHIEVE) window.STEAM_ACHIEVE("staff5"); } catch (e) {} }
    h.toast("👤 " + name + " joined as " + (TRAITS[trait]?.name || trait) + " " + h.ROLES[role].name, true);
    h.play("reward");
    h.save();
    h.render();
  }

  function renderWarRoom(d, h) {
    if (window.__AST_CRISIS_OPEN__ || window.__AST_PENDING_WARROOM__) return;
    const body = document.getElementById("decision-body");
    if (!body) return;
    window.__AST_CRISIS_OPEN__ = true;
    const opts = d.opts.map((o, i) =>
      `<button class="btn-ghost warroom-opt" data-empire-war="${i}">${o.label}</button>`
    ).join("");
    body.innerHTML = `<div style="font-size:42px">${d.ic}</div>
      <h2 style="margin:6px 0;color:var(--bad)">⚠️ ${d.title}</h2>
      <p style="color:var(--slate);font-size:14px;margin:6px 0 0">${d.text}</p>
      <div style="margin-top:14px">${opts}</div>`;
    document.getElementById("decision").style.display = "flex";
    h.play("reward");
    window.__AST_PENDING_WARROOM__ = d;
  }

  function resolveWarRoom(idx, h) {
    const d = window.__AST_PENDING_WARROOM__;
    window.__AST_PENDING_WARROOM__ = null;
    window.__AST_CRISIS_OPEN__ = false;
    document.getElementById("decision").style.display = "none";
    if (!d || !d.opts[idx]) return;
    const S = h.getState();
    S.lastChaos = Date.now();
    S.lastCrisisDay = todayStr();
    S.calmStreak = 0;
    S.crisesSurvived = (S.crisesSurvived || 0) + 1;
    const msg = d.opts[idx].fn(S, h);
    if (msg) h.toast("📣 " + msg, true);
    h.play("reward");
    h.save();
    h.render();
  }

  function chaosForecast(S) {
    const chance = ((S.chaos || 0) / 100) * (S.chaosMode ? 0.55 : 0.28) * 100;
    return Math.min(99, Math.round(chance * 60));
  }

  function injectStaffUI(S, h) {
    if (S.tab !== "staff") return;
    const main = document.getElementById("main");
    if (!main || main.querySelector("#empire-recruit-panel")) return;
    let rows = "";
    for (const role of Object.keys(h.ROLES)) {
      const cost = Math.ceil(h.hireCost(role) * 2.2);
      rows += `<button class="btn-cyan hirebtn" data-empire-recruit="${role}" ${S.yen >= cost ? "" : "disabled"} style="font-size:11px;padding:6px 10px">👤 ${h.ROLES[role].name}<small>¥${h.fmt(cost)}</small></button> `;
    }
    const list = (S.namedStaff || []).map((ns) => {
      const tr = TRAITS[ns.trait] || TRAITS.steady;
      return `<div class="staffrow named-staff"><img src="${h.ROLES[ns.role].img}" alt=""><div class="meta"><h4>${ns.name} <span class="trait">${tr.ic} ${tr.name}</span> <span class="pill">Lv ${ns.level}</span></h4>
        <div class="muted">${h.ROLES[ns.role].name} · Morale ${Math.round(ns.morale || 80)}% · +${h.fmt((h.ROLES[ns.role].power || 2) * (ns.level || 1) * (tr.power || 1) * 0.35)} bonus output</div></div></div>`;
    }).join("");
    main.insertAdjacentHTML("afterbegin", `<div class="panel empire-recruit" id="empire-recruit-panel">
      <h2>👤 Named Talent <span class="pill">${(S.namedStaff || []).length}</span></h2>
      <div class="muted" style="margin-bottom:8px;font-size:12px">Elite hires with traits — stack bonuses on top of your team.</div>
      <div class="row" style="gap:6px;flex-wrap:wrap">${rows}</div>
      ${list ? `<div style="margin-top:10px">${list}</div>` : ""}
    </div>`);
  }

  function injectStarsBanner(S, h) {
    if (S.tab !== "stars") return;
    ensureBanner(S, h);
    const main = document.getElementById("main");
    if (!main || main.querySelector(".scout-banner")) return;
    const star = h.STAR_BY_ID[S.scoutBannerStar];
    if (!star) return;
    const panel = main.querySelector(".panel");
    if (panel) {
      panel.insertAdjacentHTML("afterend", `<div class="scout-banner">
        <div style="font-weight:800;font-size:13px">🌟 Rate-Up Banner · This Week</div>
        <img src="${star.img}" alt="">
        <div style="font-weight:800">${star.name}</div>
        <div class="muted" style="font-size:11px">${star.rarity} · ${h.ROLES[star.role].name} · ${S.scoutBannerRate}x featured odds on Premium Scout</div>
      </div>`);
    }
  }

  function injectGreenlightExtras(S, h) {
    if (S.tab !== "produce") return;
    const greenPanel = [...document.querySelectorAll("#main .panel")].find((p) => p.textContent.includes("Greenlight"));
    if (!greenPanel || greenPanel.querySelector(".blend-pick")) return;

    const g2 = S.empireBlendGenre != null ? S.empireBlendGenre : -1;
    const blend = `<div class="muted" style="font-weight:800;margin-top:8px">🎨 Blend Genre <span class="pill">optional +8%</span></div>
      <div class="blend-pick"><span class="bp ${g2 < 0 ? "sel" : ""}" data-empire-blend="-1">None</span>` +
      h.GENRES.map((g, i) => `<span class="bp ${g2 === i ? "sel" : ""}" data-empire-blend="${i}">${g}</span>`).join("") + `</div>`;

    const src = S.empireSource || "original";
    const source = `<div class="muted" style="font-weight:800">📚 Source Material</div>
      <div class="source-pick">${SOURCES.map((s) =>
        `<div class="sp ${src === s.id ? "sel" : ""}" data-empire-source="${s.id}">${s.ic}<br>${s.name}</div>`
      ).join("")}</div>`;

    const genrePick = greenPanel.querySelector(".genrepick");
    if (genrePick) genrePick.insertAdjacentHTML("afterend", blend + source);
  }

  function injectProduceChaos(S, h) {
    if (S.tab !== "produce") return;
    const panel = document.querySelector(".panel .kpis")?.closest(".panel");
    if (!panel) return;
    if (!panel.querySelector(".chaos-forecast") && (S.chaos || 0) > 20) {
      const chaosBtn = panel.querySelector("[data-act=chaos-toggle]");
      if (chaosBtn) chaosBtn.insertAdjacentHTML("beforebegin",
        `<div class="chaos-forecast">📊 Crisis forecast: ~${chaosForecast(S)}% chance per minute at current chaos</div>`);
    }
    if (!panel.querySelector(".insurance-bar")) {
      const ins = S.chaosInsurance
        ? `<div class="insurance-bar">🛡️ Chaos Insurance ACTIVE — crisis costs −45%</div>`
        : `<div class="insurance-bar">🛡️ No insurance · <button class="btn-cyan hirebtn" data-empire-insurance style="padding:4px 10px;font-size:11px">Buy · ¥${h.fmt(Math.floor(h.studioValue() * 0.03))}</button></div>`;
      const streak = S.calmStreak > 0 ? `<div class="calm-streak">🕊️ Calm streak: ${S.calmStreak} days · +${Math.min(5, S.calmStreak)}💎 at 7 days</div>` : "";
      const chaosBtn = panel.querySelector("[data-act=chaos-toggle]") || panel.querySelector(".kpis");
      if (chaosBtn) (chaosBtn.parentElement || panel).insertAdjacentHTML("beforeend", ins + streak);
    }
  }

  function installHooks() {
    hook = window.__AST_HOOK__;
    if (!hook || hook.__empireInstalled) return false;
    hook.__empireInstalled = true;

    const S0 = hook.getState();
    S0.namedStaff = S0.namedStaff || [];
    S0.empireSource = S0.empireSource || "original";
    S0.empireBlendGenre = S0.empireBlendGenre != null ? S0.empireBlendGenre : -1;
    S0.calmStreak = S0.calmStreak || 0;
    S0.crisesSurvived = S0.crisesSurvived || 0;
    S0.chaosInsurance = !!S0.chaosInsurance;

    hook.hireCost = function (role) {
      const S = hook.getState();
      const r = hook.ROLES[role];
      const n = S.staff[role];
      const disc = Math.max(0.4, 1 - S.upgrades.agency * 0.05);
      return Math.ceil(r.base * Math.pow(r.growth, n) * disc);
    };

    window.__AST_MAYBE_CHAOS__ = function (fallback) {
      const S = hook.getState();
      if (window.__AST_CRISIS_OPEN__ || window.__AST_PENDING_WARROOM__) return;
      const dm = document.getElementById("decision");
      if (dm && dm.style.display === "flex") return;
      if (Date.now() - (S.lastChaos || 0) < 180000) return;
      const chance = ((S.chaos || 0) / 100) * (S.chaosMode ? 0.22 : 0.12);
      if (Math.random() >= chance) return;
      S.lastChaos = Date.now();
      const ev = WARROOM[Math.floor(Math.random() * WARROOM.length)];
      if ((S.marketShare || 0) >= 20 && Math.random() < 0.35) {
        renderWarRoom(WARROOM[2], hook);
      } else {
        renderWarRoom(ev, hook);
      }
    };

    const origGreen = hook.greenlight;
    hook.greenlight = function (pid, genre, cast, sequel) {
      const S = hook.getState();
      const slot = hook.firstEmptySlot();
      origGreen(pid, genre, cast, sequel);
      if (slot >= 0 && S.projects[slot]) {
        const pr = S.projects[slot];
        const g2i = S.empireBlendGenre;
        if (g2i >= 0 && g2i < hook.GENRES.length) pr.genre2 = hook.GENRES[g2i];
        pr.source = S.empireSource || "original";
      }
    };

    const origRelease = hook.releaseProject;
    hook.releaseProject = function (slot) {
      const S = hook.getState();
      const pr = S.projects[slot];
      if (pr) {
        const bm = blendMult(pr);
        const fm = sourceMult(pr, "fans");
        const ym = sourceMult(pr, "yen");
        S._empireReleaseMult = (S._empireReleaseMult || 1) * bm * ((fm + ym) / 2);
        S._empireStarAdj = (S._empireStarAdj || 1) * (bm > 1 ? 1.04 : 1);
      }
      origRelease(slot);
      delete S._empireReleaseMult;
      if (pr && pr.genre2 && pr.genre2 !== pr.genre) {
        try { if (window.STEAM_ACHIEVE) window.STEAM_ACHIEVE("blend1"); } catch (e) {}
      }
    };

    if (hook.pullStar) {
      const origPull = hook.pullStar;
      hook.pullStar = function (allowAll) {
        const S = hook.getState();
        ensureBanner(S, hook);
        const r = origPull(allowAll);
        if (allowAll && S.scoutBannerStar && Math.random() < 0.4) {
          const feat = hook.STAR_BY_ID[S.scoutBannerStar];
          if (feat && !feat.exclusive) {
            const owned = S.stars.find((x) => x.sid === feat.id);
            if (owned) { owned.level++; r.leveled = true; }
            else { S.stars.push({ sid: feat.id, level: 1, energy: 100, fame: 0, xp: 0, loyalty: 100, resting: false, promo: 0 }); r.leveled = false; }
            r.t = feat;
            r.rar = feat.rarity;
            hook.toast("🌟 Banner hit — " + feat.name + "!", true);
          }
        }
        return r;
      };
    }

    const origTick = hook.tick;
    if (origTick) {
      hook.tick = function (seconds) {
        origTick(seconds);
        const S = hook.getState();
        S._empireRoleBonus = computeRoleBonus(S, hook);
        if (S._empireTickDay !== todayStr()) {
          S._empireTickDay = todayStr();
          if (S.lastCrisisDay !== todayStr()) {
            S.calmStreak = (S.calmStreak || 0) + 1;
            if (S.calmStreak === 7) {
              S.gems += 5;
              hook.toast("🕊️ 7-day calm streak! +5 💎", true);
              try { if (window.STEAM_ACHIEVE) window.STEAM_ACHIEVE("calm7"); } catch (e) {}
            }
          }
        }
        for (const ns of S.namedStaff || []) {
          if (ns.morale < 100) ns.morale = Math.min(100, (ns.morale || 80) + 0.15 * seconds);
        }
      };
    }

    const origRender = hook.render;
    hook.render = function () {
      origRender();
      const S = hook.getState();
      S._empireRoleBonus = computeRoleBonus(S);
      injectStaffUI(S, hook);
      injectStarsBanner(S, hook);
      injectGreenlightExtras(S, hook);
      injectProduceChaos(S, hook);
    };

    document.addEventListener("click", (e) => {
      const t = e.target.closest("[data-empire-recruit],[data-empire-blend],[data-empire-source],[data-empire-insurance],[data-empire-war]");
      if (!t) return;
      const S = hook.getState();
      if (t.dataset.empireRecruit) return recruitNamed(t.dataset.empireRecruit, hook);
      if (t.dataset.empireBlend != null) {
        S.empireBlendGenre = +t.dataset.empireBlend;
        hook.save();
        hook.render();
        return;
      }
      if (t.dataset.empireSource) {
        S.empireSource = t.dataset.empireSource;
        hook.save();
        hook.render();
        return;
      }
      if (t.dataset.empireInsurance != null) {
        const cost = Math.floor(hook.studioValue() * 0.03);
        if (S.yen < cost) { hook.toast("Need ¥" + hook.fmt(cost)); return; }
        S.yen -= cost;
        S.chaosInsurance = true;
        try { if (window.STEAM_ACHIEVE) window.STEAM_ACHIEVE("insurance"); } catch (e) {}
        hook.toast("🛡️ Chaos Insurance active!", true);
        hook.save();
        hook.render();
        return;
      }
      if (t.dataset.empireWar != null) return resolveWarRoom(+t.dataset.empireWar, hook);
    });

    return true;
  }

  const poll = setInterval(() => {
    if (installHooks()) clearInterval(poll);
  }, 80);
})();