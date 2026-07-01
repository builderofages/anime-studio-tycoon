/**
 * Anime Studio Tycoon — Studio+ expansion (v7)
 * 10x scout, spark shop, polish phase, rivalries/friendships, morale heatmap,
 * production templates, expanded records, in-theme confirms.
 */
(function () {
  const SCOUT_10X = 72;
  const SPARK_EPIC = 15;
  const SPARK_LEG = 40;

  const RIVALS = [
    ["mei", "haru"], ["rin", "kira"], ["sho", "finn"],
  ];
  const FRIENDS = [
    ["yui", "sven"], ["aki", "jun"], ["luna", "noa"],
  ];

  let pendingConfirmCb = null;

  function relationTags(cast) {
    if (!cast || cast.length < 2) return { mult: 1, tags: [] };
    const set = new Set(cast);
    const tags = [];
    let mult = 1;
    for (const [a, b] of FRIENDS) {
      if (set.has(a) && set.has(b)) { tags.push({ t: "friend", name: "Friends", ic: "💚" }); mult *= 1.07; }
    }
    for (const [a, b] of RIVALS) {
      if (set.has(a) && set.has(b)) { tags.push({ t: "rival", name: "Rivals", ic: "💢" }); mult *= 0.93; }
    }
    return { mult, tags };
  }

  function setupConfirmModal() {
    if (document.getElementById("confirm-theme")) return;
    const el = document.createElement("div");
    el.id = "confirm-theme";
    el.className = "overlay";
    el.style.display = "none";
    el.innerHTML = `<div class="card-modal" style="max-width:380px">
      <h2 id="confirm-theme-title" style="margin:4px 0;font-size:20px"></h2>
      <p id="confirm-theme-body" class="muted" style="font-size:13px;margin:8px 0"></p>
      <div class="row" style="gap:10px;margin-top:14px">
        <button class="btn-primary" data-studio-confirm-yes style="flex:1">Confirm</button>
        <button class="btn-ghost" data-studio-confirm-no style="flex:1">Cancel</button>
      </div></div>`;
    document.body.appendChild(el);
  }

  window.__AST_CONFIRM__ = function (title, body, cb) {
    setupConfirmModal();
    document.getElementById("confirm-theme-title").textContent = title;
    document.getElementById("confirm-theme-body").textContent = body;
    pendingConfirmCb = cb;
    document.getElementById("confirm-theme").style.display = "flex";
  };

  function addSparks(S, n) {
    S.sparks = (S.sparks || 0) + n;
  }

  function scout10x(h) {
    const S = h.getState();
    if (!S.ageOk && typeof ageGate === "function") return ageGate(() => scout10x(h));
    if (S.gems < SCOUT_10X) {
      h.toast("Need " + SCOUT_10X + " 💎 for 10× Scout");
      return;
    }
    S.gems -= SCOUT_10X;
    const results = [];
    for (let i = 0; i < 10; i++) {
      const r = h.pullStar(true);
      results.push(r);
      if (r.rar === "Epic" || r.rar === "Legendary") break;
    }
    const best = results.reduce((a, b) => {
      const order = ["Common", "Rare", "Epic", "Legendary"];
      return order.indexOf(b.rar) > order.indexOf(a.rar) ? b : a;
    }, results[0]);
    let dupes = 0;
    results.forEach((r) => { if (r.leveled) dupes++; });
    if (dupes) addSparks(S, dupes);
    h.toast("🌟 10× Scout complete! Best: " + best.rar + " " + best.t.name, best.rar !== "Common");
    if (typeof showReveal === "function") showReveal(best.t, best.rar, best.leveled);
    h.play("reward");
    h.save();
    h.render();
    try { if (window.STEAM_ACHIEVE) window.STEAM_ACHIEVE("scout10"); } catch (e) {}
  }

  function sparkBuy(tier, h) {
    const S = h.getState();
    const cost = tier === "leg" ? SPARK_LEG : SPARK_EPIC;
    if ((S.sparks || 0) < cost) {
      h.toast("Need " + cost + " ✨ Sparks (dupe scouts grant sparks)");
      return;
    }
    S.sparks -= cost;
    S.pityCount = 0;
    const pool = h.STAR_POOL.filter((s) => !s.exclusive && s.rarity === (tier === "leg" ? "Legendary" : "Epic"));
    const t = pool[Math.floor(Math.random() * pool.length)];
    const owned = S.stars.find((x) => x.sid === t.id);
    let leveled = false;
    if (owned) { owned.level++; leveled = true; }
    else S.stars.push({ sid: t.id, level: 1, energy: 100, fame: 0, xp: 0, loyalty: 100, resting: false, promo: 0 });
    h.toast("✨ Spark Exchange: " + t.name + "!", true);
    if (typeof showReveal === "function") showReveal(t, t.rarity, leveled);
    h.play("reward");
    h.save();
    h.render();
  }

  function polishShow(slot, h) {
    const S = h.getState();
    const pr = S.projects[slot];
    if (!pr) return;
    const p = h.getProject(pr.pid);
    if (pr.progress >= p.work) { h.toast("Already ready — polish before premiere from release bonus"); return; }
    if (S.hype < 4) { h.toast("Need 4 Hype to Polish"); return; }
    S.hype -= 4;
    pr.polished = (pr.polished || 0) + 1;
    pr.progress = Math.min(p.work, pr.progress + p.work * 0.06);
    h.toast("✨ Polish pass #" + pr.polished + " — better premiere rating!", true);
    h.play("click");
    h.save();
    h.render();
  }

  function saveTemplate(h) {
    const S = h.getState();
    S.templates = S.templates || [];
    if (S.templates.length >= 5) S.templates.shift();
    const name = "Template " + (S.templates.length + 1);
    S.templates.push({
      name,
      genre: S._selGenreSnapshot ?? 0,
      blend: S.empireBlendGenre,
      source: S.empireSource,
      risk: S.endlessRisk,
      cour: S.endlessCourMode,
    });
    h.toast("📋 Saved greenlight template: " + name, true);
    h.save();
    h.render();
  }

  function applyTemplate(idx, h) {
    const S = h.getState();
    const t = (S.templates || [])[idx];
    if (!t) return;
    S.empireBlendGenre = t.blend;
    S.empireSource = t.source;
    S.endlessRisk = t.risk;
    S.endlessCourMode = t.cour;
    h.toast("📋 Applied template: " + t.name);
    h.render();
  }

  function expandedRecordsHTML(S, h) {
    const rows = [
      ["💰 Lifetime ¥", h.fmt(S.totalEarned || 0)],
      ["🎬 Premieres", h.fmt(S.releases || 0)],
      ["🔗 Best combo", "×" + (S.comboBest || 0)],
      ["📊 Market share", (S.marketShare || 5) + "%"],
      ["⚔️ Bids won", h.fmt(S.bidsWon || 0)],
      ["🕊️ Calm streak", h.fmt(S.calmStreak || 0) + " days"],
      ["⚠️ Crises survived", h.fmt(S.crisesSurvived || 0)],
      ["👤 Named staff", h.fmt((S.namedStaff || []).length)],
      ["✨ Sparks", h.fmt(S.sparks || 0)],
      ["🍀 Scout pity", h.fmt(S.pityCount || 0)],
      ["🧸 Merch tier", h.fmt(S.merchLevel || 0)],
      ["🏆 Industry best", "#" + (S.bestRank || 99)],
    ];
    return `<div class="panel"><h2>📊 Studio+ Records</h2>
      <div class="records-grid">${rows.map(([l, v]) =>
        `<div class="record-card"><div class="rc-lbl">${l}</div><div class="rc-val">${v}</div></div>`
      ).join("")}</div></div>`;
  }

  function injectStarsUI(S, h) {
    if (S.tab !== "stars") return;
    const main = document.getElementById("main");
    if (!main || main.querySelector(".spark-shop")) return;
    const panel = main.querySelector(".panel");
    if (!panel) return;
    panel.insertAdjacentHTML("beforeend", `
      <div class="scout-10x">
        <button class="btn-gold hirebtn" data-studio-10x ${S.gems >= SCOUT_10X ? "" : "disabled"} style="width:100%">🌟 10× Premium Scout<small>${SCOUT_10X} 💎</small></button>
      </div>
      <div class="spark-shop">
        <div class="spark-bal">✨ ${S.sparks || 0} Sparks</div>
        <div class="muted" style="font-size:11px;margin-bottom:8px">Earn sparks when duplicate scouts level up a star.</div>
        <div class="row" style="gap:8px;flex-wrap:wrap">
          <button class="btn-cyan hirebtn" data-studio-spark="epic" ${(S.sparks || 0) >= SPARK_EPIC ? "" : "disabled"}>Epic Pick · ${SPARK_EPIC}✨</button>
          <button class="btn-gold hirebtn" data-studio-spark="leg" ${(S.sparks || 0) >= SPARK_LEG ? "" : "disabled"}>Legendary · ${SPARK_LEG}✨</button>
        </div>
      </div>`);
  }

  function injectStaffMorale(S, h) {
    if (S.tab !== "staff" || !(S.namedStaff || []).length) return;
    const panel = document.getElementById("empire-recruit-panel") || document.querySelector("#main .panel");
    if (!panel || panel.querySelector(".morale-heat")) return;
    const cells = (S.namedStaff || []).map((ns) => {
      const m = Math.round(ns.morale || 80);
      const cls = m >= 70 ? "morale-high" : m >= 40 ? "morale-mid" : "morale-low";
      return `<div class="morale-cell ${cls}">${ns.name.split(" ")[0]}<br>${m}%</div>`;
    }).join("");
    panel.insertAdjacentHTML("beforeend", `<div class="muted" style="font-weight:800;margin-top:10px">🔥 Morale Heatmap</div><div class="morale-heat">${cells}</div>`);
  }

  function injectProduceTemplates(S, h) {
    if (S.tab !== "produce") return;
    const greenPanel = [...document.querySelectorAll("#main .panel")].find((p) => p.textContent.includes("Greenlight"));
    if (!greenPanel || greenPanel.querySelector(".template-bar")) return;
    const tpls = (S.templates || []).map((t, i) =>
      `<span class="tpl" data-studio-tpl="${i}">📋 ${t.name}</span>`
    ).join("");
    const genrePick = greenPanel.querySelector(".genrepick");
    if (genrePick) {
      genrePick.insertAdjacentHTML("beforebegin", `<div class="template-bar">${tpls}
        <button class="btn-ghost hirebtn" data-studio-save-tpl style="padding:6px 10px;font-size:10px">+ Save Template</button></div>`);
    }
  }

  function injectPolishButtons(S, h) {
    if (S.tab !== "produce") return;
    S.projects.forEach((pr, i) => {
      if (!pr) return;
      const p = h.getProject(pr.pid);
      if (pr.progress >= p.work) return;
      const panel = document.getElementById("slot-" + i);
      if (!panel || panel.querySelector("[data-studio-polish]")) return;
      const row = panel.querySelector(".row");
      if (row) {
        row.insertAdjacentHTML("beforeend",
          `<button class="btn-ghost polish-btn" data-studio-polish="${i}" ${S.hype >= 4 ? "" : "disabled"}>✨ Polish (4⚡)${pr.polished ? " ·×" + pr.polished : ""}</button>`);
      }
      const rel = relationTags(pr.cast);
      if (rel.tags.length && !panel.querySelector(".relation-tag")) {
        const castLine = panel.querySelector(".pinfo");
        if (castLine) {
          const tags = rel.tags.map((t) =>
            `<span class="relation-tag relation-${t.t}">${t.ic} ${t.name}</span>`
          ).join("");
          castLine.insertAdjacentHTML("beforeend", `<div style="margin-top:4px">${tags}</div>`);
        }
      }
    });
  }

  function installHooks() {
    const hook = window.__AST_HOOK__;
    if (!hook || hook.__studioInstalled) return false;
    hook.__studioInstalled = true;
    setupConfirmModal();

    const S0 = hook.getState();
    S0.sparks = S0.sparks || 0;
    S0.templates = S0.templates || [];

    const origPull = hook.pullStar;
    if (origPull) {
      hook.pullStar = function (allowAll) {
        const S = hook.getState();
        const before = new Set((S.stars || []).map((s) => s.sid));
        const r = origPull(allowAll);
        if (before.has(r.t.id)) addSparks(S, 1);
        return r;
      };
    }

    const origRelease = hook.releaseProject;
    hook.releaseProject = function (slot) {
      const S = hook.getState();
      const pr = S.projects[slot];
      if (pr) {
        const rel = relationTags(pr.cast);
        let m = rel.mult;
        if (pr.polished) m *= 1 + Math.min(0.15, pr.polished * 0.04);
        S._studioReleaseMult = m;
        S._studioStarAdj = pr.polished ? 1 + Math.min(0.2, pr.polished * 0.05) : 1;
      }
      origRelease(slot);
      delete S._studioReleaseMult;
      delete S._studioStarAdj;
    };

    const origRender = hook.render;
    hook.render = function () {
      const S = hook.getState();
      origRender();
      injectStarsUI(S, hook);
      injectStaffMorale(S, hook);
      injectProduceTemplates(S, hook);
      injectPolishButtons(S, hook);
      if (S.tab === "studio") {
        const main = document.getElementById("main");
        if (main && !main.querySelector(".records-grid")) {
          const stats = main.querySelector(".panel.listgrid");
          if (stats) stats.insertAdjacentHTML("afterend", expandedRecordsHTML(S, hook));
        }
      }
    };

    document.addEventListener("click", (e) => {
      const t = e.target.closest("[data-studio-10x],[data-studio-spark],[data-studio-polish],[data-studio-save-tpl],[data-studio-tpl],[data-studio-confirm-yes],[data-studio-confirm-no]");
      if (!t) return;
      if (t.dataset.studio10x != null) return scout10x(hook);
      if (t.dataset.studioSpark) return sparkBuy(t.dataset.studioSpark, hook);
      if (t.dataset.studioPolish != null) return polishShow(+t.dataset.studioPolish, hook);
      if (t.dataset.studioSaveTpl != null) return saveTemplate(hook);
      if (t.dataset.studioTpl != null) return applyTemplate(+t.dataset.studioTpl, hook);
      if (t.dataset.studioConfirmYes != null) {
        document.getElementById("confirm-theme").style.display = "none";
        if (pendingConfirmCb) { const cb = pendingConfirmCb; pendingConfirmCb = null; cb(); }
        return;
      }
      if (t.dataset.studioConfirmNo != null) {
        document.getElementById("confirm-theme").style.display = "none";
        pendingConfirmCb = null;
        return;
      }
    });

    return true;
  }

  const poll = setInterval(() => {
    if (installHooks()) clearInterval(poll);
  }, 80);
})();