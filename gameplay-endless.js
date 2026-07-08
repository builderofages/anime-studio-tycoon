/**
 * Anime Studio Tycoon — Endless expansion (v5)
 * Star moods, chemistry, risk dial, cour seasons, mid-production events, difficulty tiers, cancel prod, auto-rest.
 */
(function () {
  const RISKS = [
    { id: "safe", ic: "🛡️", name: "Safe", star: 0.92, income: 0.95, chaos: -0.08 },
    { id: "balanced", ic: "⚖️", name: "Balanced", star: 1, income: 1, chaos: 0 },
    { id: "ambitious", ic: "🚀", name: "Ambitious", star: 1.12, income: 1.18, chaos: 0.15 },
  ];

  const DIFFS = [
    { id: "casual", ic: "🌸", name: "Casual", reward: 0.88, chaos: 0.55, stamina: 0.75 },
    { id: "standard", ic: "🎬", name: "Standard", reward: 1, chaos: 1, stamina: 1 },
    { id: "hard", ic: "🔥", name: "Hard", reward: 1.14, chaos: 1.28, stamina: 1.15 },
    { id: "nightmare", ic: "💀", name: "Nightmare", reward: 1.32, chaos: 1.75, stamina: 1.4 },
  ];

  const DUOS = [
    { ids: ["rin", "sora"], name: "Ink & Script", bonus: 0.1 },
    { ids: ["hana", "taki"], name: "Voice & Vision", bonus: 0.1 },
    { ids: ["miyo", "kenji"], name: "Legendary Duo", bonus: 0.15 },
    { ids: ["mei", "haru"], name: "Rare Pair", bonus: 0.06 },
    { ids: ["yuki", "luna"], name: "Star Writers", bonus: 0.12 },
  ];

  const MID_EVENTS = [
    { id: "break", ic: "✨", text: "Animator breakthrough!", prog: 0.08 },
    { id: "viral", ic: "📱", text: "Viral behind-the-scenes clip!", hype: 8 },
    { id: "sick", ic: "🤒", text: "Voice actor caught a cold", prog: -0.05 },
    { id: "budget", ic: "💸", text: "Unexpected budget overrun", yen: -0.04 },
    { id: "inspire", ic: "💡", text: "Director's vision clicks!", prog: 0.06, hype: 3 },
  ];

  let lastEventAt = 0;

  function starMood(st, hook) {
    const en = hook.starEnergy(st);
    const loy = st.loyalty == null ? 100 : st.loyalty;
    if (en >= 70 && loy >= 55) return { id: "inspired", ic: "✨", mult: 1.1 };
    if (en < 30) return { id: "tired", ic: "😴", mult: 0.85 };
    if (loy < 38) return { id: "restless", ic: "😤", mult: 0.95 + Math.random() * 0.12 };
    return { id: "steady", ic: "", mult: 1 };
  }

  function moodMultForCast(pr, hook) {
    if (!pr || !pr.cast || !pr.cast.length) return 1;
    const S = hook.getState();
    let m = 1;
    for (const id of pr.cast) {
      const st = (S.stars || []).find((x) => x.sid === id);
      if (st) m *= starMood(st, hook).mult;
    }
    return Math.pow(m, 1 / pr.cast.length);
  }

  function chemistryBonus(pr) {
    if (!pr || !pr.cast || pr.cast.length < 2) return { mult: 1, name: "" };
    const set = new Set(pr.cast);
    for (const d of DUOS) {
      if (d.ids.every((id) => set.has(id))) return { mult: 1 + d.bonus, name: d.name };
    }
    return { mult: 1, name: "" };
  }

  function riskOf(pr) {
    return RISKS.find((r) => r.id === (pr && pr.risk)) || RISKS[1];
  }

  function diffOf(S) {
    return DIFFS.find((d) => d.id === (S.endlessDiff || "standard")) || DIFFS[1];
  }

  function computeStarAdj(S, pr, hook) {
    const risk = riskOf(pr);
    const chem = chemistryBonus(pr);
    const mood = moodMultForCast(pr, hook);
    return risk.star * chem.mult * mood;
  }

  function computeReleaseMult(S, pr, hook) {
    const risk = riskOf(pr);
    const chem = chemistryBonus(pr);
    const diff = diffOf(S);
    let m = risk.income * diff.reward * chem.mult;
    if (pr.cour && pr.cour.ep >= pr.cour.total) m *= 1.25;
    return m;
  }

  function releaseCourEpisode(slot, hook, origRelease) {
    const S = hook.getState();
    const pr = S.projects[slot];
    if (!pr || !pr.cour) return origRelease(slot);
    const p = hook.getProject(pr.pid);
    if (pr.progress < p.work) return;

    S._endlessStarAdj = computeStarAdj(S, pr, hook);
    const stars = hook.projectStars(p, pr.genre, pr);
    delete S._endlessStarAdj;

    const mult = stars / 3;
    const epMult = 0.38 * diffOf(S).reward;
    const trendBonus = pr.genre === hook.trendGenre() ? 1.5 : 1;
    const yenGain = Math.floor(p.base * mult * epMult * trendBonus * (1 + S.fans * 0.00002));
    const fansGain = Math.max(1, Math.floor(p.fans * mult * epMult * trendBonus * 0.5));

    S.yen += yenGain;
    S.fans += fansGain;
    S.totalFansEver += fansGain;
    S.hype += 2;
    pr.cour.ep += 1;
    pr.progress = 0;
    pr.title = (pr.title || p.name) + " · Ep " + pr.cour.ep;

    hook.toast(`📺 Episode ${pr.cour.ep - 1} aired! +¥${hook.fmt(yenGain)} +${hook.fmt(fansGain)} fans`, true);
    hook.play("reward");

    hook.save();
    hook.render();
  }

  function cancelProduction(slot, hook) {
    const S = hook.getState();
    const pr = S.projects[slot];
    if (!pr) return;
    const p = hook.getProject(pr.pid);
    const pct = pr.progress / p.work;
    const refund = Math.floor(p.cost * Math.max(0.15, 0.5 * (1 - pct)));
    S.projects[slot] = null;
    S.yen += refund;
    hook.toast(`🛑 Cancelled — refunded ¥${hook.fmt(refund)}`);
    hook.play("click");
    hook.save();
    hook.render();
  }

  function autoRestStars(S, hook) {
    if (!S.settings || !S.settings.autoRest) return;
    for (const st of S.stars || []) {
      if (!st.resting && hook.starEnergy(st) < 22) st.resting = true;
    }
  }

  function maybeMidProdEvent(S, hook, seconds) {
    if (Date.now() - lastEventAt < 45000) return;
    const active = (S.projects || []).filter(Boolean);
    if (!active.length || Math.random() > 0.018 * seconds) return;

    const pr = active[Math.floor(Math.random() * active.length)];
    const slot = S.projects.indexOf(pr);
    const p = hook.getProject(pr.pid);
    const ev = MID_EVENTS[Math.floor(Math.random() * MID_EVENTS.length)];
    lastEventAt = Date.now();

    S.endlessEvents = (S.endlessEvents || 0) + 1;
    pr.lastEvent = { ...ev, t: Date.now() };

    if (ev.prog) {
      pr.progress = Math.max(0, Math.min(p.work, pr.progress + p.work * ev.prog));
    }
    if (ev.hype) S.hype += ev.hype;
    if (ev.yen) {
      const loss = Math.floor(S.yen * Math.abs(ev.yen));
      if (ev.yen < 0 && S.yen >= loss) S.yen -= loss;
    }
    if (ev.id === "sick" && pr.cast && pr.cast.length) {
      const id = pr.cast[Math.floor(Math.random() * pr.cast.length)];
      const st = (S.stars || []).find((x) => x.sid === id);
      if (st) st.energy = Math.max(0, hook.starEnergy(st) - 20);
    }

    hook.toast(`${ev.ic} ${ev.text}`);
    hook.save();
    if (S.tab === "produce") hook.render();
  }

  function riskDialHTML(S) {
    const cur = S.endlessRisk || "balanced";
    return `<div class="muted" style="font-weight:800;margin-top:8px">🎲 Production Risk</div>
      <div class="risk-dial">${RISKS.map((r) =>
        `<div class="rd ${cur === r.id ? "sel" : ""}" data-endless-risk="${r.id}" title="${r.name}">${r.ic} ${r.name}</div>`
      ).join("")}</div>
      <label class="cour-toggle"><input type="checkbox" data-endless-cour ${S.endlessCourMode ? "checked" : ""}> 📺 12-Episode Cour (episodic premieres + finale bonus)</label>`;
  }

  function injectProduceUI(S, hook) {
    const main = document.getElementById("main");
    if (!main || S.tab !== "produce") return;

    const gl = main.querySelector(".panel h2");
    const greenPanel = [...main.querySelectorAll(".panel")].find((p) => p.textContent.includes("Greenlight"));
    if (greenPanel && !greenPanel.querySelector(".risk-dial")) {
      const genrePick = greenPanel.querySelector(".genrepick");
      if (genrePick) genrePick.insertAdjacentHTML("beforebegin", riskDialHTML(S));
    }

    S.projects.forEach((pr, i) => {
      if (!pr) return;
      const panel = document.getElementById("slot-" + i);
      if (!panel) return;
      if (pr.cour && !panel.querySelector(".cour-ep")) {
        const eta = panel.querySelector(".slot-eta");
        if (eta) eta.insertAdjacentHTML("afterend", `<div class="cour-ep">📺 Cour Ep ${pr.cour.ep}/${pr.cour.total}</div>`);
      }
      const chem = chemistryBonus(pr);
      if (chem.name && !panel.querySelector(".chem-banner")) {
        const card = panel.querySelector(".pinfo");
        if (card) card.insertAdjacentHTML("afterbegin", `<div class="chem-banner">🤝 Chemistry: ${chem.name} (+${Math.round(chem.bonus * 100)}%)</div>`);
      }
      if (!panel.querySelector("[data-endless-cancel]")) {
        const row = panel.querySelector(".row");
        if (row && pr.progress < hook.getProject(pr.pid).work) {
          row.insertAdjacentHTML("beforeend", `<button class="btn-ghost btn-cancel-prod" data-endless-cancel="${i}">🛑 Cancel</button>`);
        }
      }
      if (pr.lastEvent && Date.now() - pr.lastEvent.t < 12000 && !panel.querySelector(".prod-event")) {
        const card = panel.querySelector(".card");
        if (card) card.insertAdjacentHTML("afterend", `<div class="prod-event">${pr.lastEvent.ic} ${pr.lastEvent.text}</div>`);
      }
    });

    if (!main.querySelector("#endless-diff-panel")) {
      const hero = main.querySelector(".hero-card") || main.querySelector(".panel");
      if (hero) {
        hero.insertAdjacentHTML("afterend", `<div class="panel endless-panel" id="endless-diff-panel">
          <h3>🎚️ Difficulty <span class="diff-badge">${diffOf(S).ic} ${diffOf(S).name}</span></h3>
          <div class="muted" style="font-size:11px;margin-bottom:6px">Affects rewards, chaos rise, and stamina drain.</div>
          <div class="diff-pick">${DIFFS.map((d) =>
            `<div class="dp ${(S.endlessDiff || "standard") === d.id ? "sel" : ""}" data-endless-diff="${d.id}">${d.ic}<br>${d.name}</div>`
          ).join("")}</div>
        </div>`);
      }
    }
  }

  function injectStarsMoods(S, hook) {
    if (S.tab !== "stars") return;
    for (const st of S.stars || []) {
      const row = document.querySelector(`[data-sid="${st.sid}"]`)?.closest(".staffrow");
      if (!row || row.querySelector(".mood-pill")) continue;
      const mood = starMood(st, hook);
      if (mood.id === "steady") continue;
      const h4 = row.querySelector("h4");
      if (h4) h4.insertAdjacentHTML("beforeend", `<span class="mood-pill mood-${mood.id}">${mood.ic} ${mood.id}</span>`);
    }
  }

  function extendSettings(S) {
    const panel = document.getElementById("settings-panel");
    if (!panel || panel.querySelector("[data-endless-autorest]")) return;
    const html = `<div class="setting-row"><span>💤 Auto-rest tired stars</span><input type="checkbox" data-endless-autorest></div>`;
    const btn = panel.querySelector("[data-settings-close]");
    if (btn) btn.insertAdjacentHTML("beforebegin", html);
    const cb = panel.querySelector("[data-endless-autorest]");
    if (cb) cb.checked = !!(S.settings && S.settings.autoRest);
  }

  function installHooks() {
    const hook = window.__AST_HOOK__;
    if (!hook || hook.__endlessInstalled) return false;
    hook.__endlessInstalled = true;

    const S0 = hook.getState();
    S0.endlessRisk = S0.endlessRisk || "balanced";
    S0.endlessDiff = S0.endlessDiff || "standard";
    S0.endlessCourMode = !!S0.endlessCourMode;
    S0.endlessEvents = S0.endlessEvents || 0;
    S0.settings = Object.assign({ autoRest: false }, S0.settings || {});

    const origGreen = hook.greenlight;
    hook.greenlight = function (pid, genre, cast, sequel) {
      const S = hook.getState();
      const slot = hook.firstEmptySlot();
      origGreen(pid, genre, cast, sequel);
      if (slot >= 0 && S.projects[slot]) {
        const pr = S.projects[slot];
        pr.risk = S.endlessRisk || "balanced";
        if (S.endlessCourMode) pr.cour = { ep: 1, total: 12 };
      }
    };

    const origRelease = hook.releaseProject;
    hook.releaseProject = function (slot) {
      const S = hook.getState();
      const pr = S.projects[slot];
      if (!pr) return origRelease(slot);
      const p = hook.getProject(pr.pid);
      if (pr.cour && pr.cour.ep < pr.cour.total && pr.progress >= p.work) {
        return releaseCourEpisode(slot, hook, origRelease);
      }
      const courFinale = !!(pr.cour && pr.cour.ep >= pr.cour.total);
      S._endlessReleaseMult = computeReleaseMult(S, pr, hook);
      S._endlessStarAdj = computeStarAdj(S, pr, hook);
      origRelease(slot);
      if (courFinale) {
        try { if (window.STEAM_ACHIEVE) window.STEAM_ACHIEVE("cour12"); } catch (e) {}
      }
      delete S._endlessReleaseMult;
      delete S._endlessStarAdj;
    };

    const origTick = hook.tick;
    if (origTick) {
      hook.tick = function (seconds) {
        const S = hook.getState();
        const diff = diffOf(S);
        const chaos0 = S.chaos;
        origTick(seconds);
        if (S.chaos != null && chaos0 != null && diff.chaos !== 1) {
          const delta = (S.chaos || 0) - chaos0;
          S.chaos = Math.max(0, Math.min(100, chaos0 + delta * diff.chaos));
        }
        if (S.chaosMode && S.chaos != null && chaos0 != null) {
          const rise = (S.chaos || 0) - chaos0;
          if (rise > 0) S.chaos = Math.max(0, Math.min(100, chaos0 + rise * 1.35));
        }
        if (S.stamina != null && diff.stamina !== 1) {
          const st0 = 100 - (S.stamina || 100);
          S.stamina = Math.max(0, Math.min(100, 100 - st0 * diff.stamina));
        }
        for (const pr of S.projects || []) {
          if (!pr) continue;
          const r = riskOf(pr);
          if (r.chaos && Math.random() < Math.abs(r.chaos) * 0.002 * seconds) {
            S.chaos = Math.max(0, Math.min(100, (S.chaos || 0) + r.chaos * 8));
          }
        }
        autoRestStars(S, hook);
        maybeMidProdEvent(S, hook, seconds);
      };
    }

    const origRender = hook.render;
    hook.render = function () {
      origRender();
      const S = hook.getState();
      extendSettings(S);
      if (document.documentElement.classList.contains("hud-v3-active")) return;
      injectProduceUI(S, hook);
      injectStarsMoods(S, hook);
    };

    document.addEventListener("click", (e) => {
      const t = e.target.closest("[data-endless-risk],[data-endless-cour],[data-endless-diff],[data-endless-cancel],[data-endless-autorest]");
      if (!t) return;
      const S = hook.getState();
      if (t.dataset.endlessRisk) {
        S.endlessRisk = t.dataset.endlessRisk;
        hook.save();
        hook.render();
        return;
      }
      if (t.dataset.endlessCour != null) {
        S.endlessCourMode = t.checked;
        hook.save();
        return;
      }
      if (t.dataset.endlessDiff) {
        S.endlessDiff = t.dataset.endlessDiff;
        hook.toast(`${DIFFS.find((d) => d.id === t.dataset.endlessDiff)?.ic} Difficulty: ${t.dataset.endlessDiff}`, true);
        hook.save();
        hook.render();
        return;
      }
      if (t.dataset.endlessCancel != null) return cancelProduction(+t.dataset.endlessCancel, hook);
      if (t.dataset.endlessAutorest != null) {
        S.settings = S.settings || {};
        S.settings.autoRest = t.checked;
        hook.save();
        return;
      }
    });

    return true;
  }

  const poll = setInterval(() => {
    if (installHooks()) clearInterval(poll);
  }, 80);
})();