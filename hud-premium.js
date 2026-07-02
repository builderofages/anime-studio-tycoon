/**
 * Anime Studio Tycoon — Premium HUD & Pathway System (v11)
 * Rebuilds chrome: command HUD, journey rail, tab badges, smart next-action.
 */
(function () {
  const JOURNEY = [
    { id: "hire", ic: "👥", lbl: "Hire" },
    { id: "greenlight", ic: "🎬", lbl: "Greenlight" },
    { id: "produce", ic: "⚙️", lbl: "Produce" },
    { id: "premiere", ic: "🎉", lbl: "Premiere" },
    { id: "grow", ic: "📈", lbl: "Grow" },
    { id: "empire", ic: "👑", lbl: "Empire" },
  ];

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
    if (score >= 92) return { g: "S", cls: "rank-s" };
    if (score >= 78) return { g: "A", cls: "rank-a" };
    if (score >= 62) return { g: "B", cls: "rank-b" };
    if (score >= 45) return { g: "C", cls: "rank-c" };
    return { g: "D", cls: "rank-d" };
  }

  function staffTotal(S) {
    const st = S.staff || {};
    return (st.animator || 0) + (st.writer || 0) + (st.director || 0) + (st.voice || 0) + (st.producer || 0);
  }

  function activeCount(S) {
    return (S.projects || []).filter(Boolean).length;
  }

  function readySlot(S, hook) {
    for (let i = 0; i < (S.projects || []).length; i++) {
      const pr = S.projects[i];
      if (!pr) continue;
      const p = hook.getProject(pr.pid);
      if (pr.progress >= p.work) return i;
    }
    return -1;
  }

  const QUEST_METRICS = {
    rel: "releases", rel2: "releases", yen: "yen", big: "yen", camp: "campaigns",
    hire: "hires", hire2: "hires", hype: "hypeSpent", scout: "scouts",
    green: "greenlit", tap: "taps", tap2: "taps",
  };

  function claimableQuests(S) {
    let n = 0;
    (S.quests || []).forEach((q) => {
      if (q.claimed) return;
      const key = QUEST_METRICS[q.id] || q.id;
      if (((S.questProg || {})[key] || 0) >= q.goal) n++;
    });
    (S.weeklyQuests || []).forEach((q) => {
      if (q.claimed) return;
      const key = QUEST_METRICS[q.id] || q.id;
      if (((S.weekProg || {})[key] || 0) >= q.goal) n++;
    });
    return n;
  }

  function analyzePathway(S, hook) {
    const ready = readySlot(S, hook);
    if (ready >= 0) {
      return {
        phase: "premiere",
        phaseIdx: 3,
        message: "🎉 A production is ready — premiere it now for fans & yen!",
        tab: "produce",
        cta: "Premiere Now",
        urgent: true,
        action: { type: "tab", tab: "produce" },
      };
    }
    if ((S.releases || 0) === 0 && activeCount(S) === 0) {
      if (staffTotal(S) === 0) {
        return {
          phase: "hire",
          phaseIdx: 0,
          message: "👥 Hire your first staff — animators & writers power every show.",
          tab: "staff",
          cta: "Hire Staff",
          action: { type: "tab", tab: "staff" },
        };
      }
      if (S.yen < 100) {
        return {
          phase: "hire",
          phaseIdx: 0,
          message: "🖌️ Low on cash — tap Freelance on Produce or wait for royalties.",
          tab: "produce",
          cta: "Go Produce",
          action: { type: "tab", tab: "produce" },
        };
      }
      return {
        phase: "greenlight",
        phaseIdx: 1,
        message: "🎬 Greenlight your first anime — pick a genre & project type.",
        tab: "produce",
        cta: "Greenlight",
        action: { type: "tab", tab: "produce" },
      };
    }
    if (activeCount(S) > 0 && (S.releases || 0) < 5) {
      return {
        phase: "produce",
        phaseIdx: 2,
        message: "⚙️ Production running — tap posters to boost speed, or greenlight more shows.",
        tab: "produce",
        cta: "View Lines",
        action: { type: "tab", tab: "produce" },
      };
    }
    if ((S.stars || []).length === 0 && S.fans >= 50) {
      return {
        phase: "grow",
        phaseIdx: 4,
        message: "⭐ Stars tab unlocked — scout talent for bigger premieres!",
        tab: "stars",
        cta: "Scout Stars",
        action: { type: "tab", tab: "stars" },
      };
    }
    if (claimableQuests(S) > 0) {
      return {
        phase: "grow",
        phaseIdx: 4,
        message: "📋 Quest rewards ready to claim — free gems waiting!",
        tab: "quests",
        cta: "Claim Rewards",
        urgent: true,
        action: { type: "tab", tab: "quests" },
      };
    }
    if ((S.dynastyPoints || 0) - (S.dynastySpent || 0) >= 12 && (S.releases || 0) >= 15) {
      return {
        phase: "empire",
        phaseIdx: 5,
        message: "👑 Dynasty points available — buy permanent perks in Studio.",
        tab: "studio",
        cta: "Dynasty Perks",
        action: { type: "tab", tab: "studio" },
      };
    }
    if ((S.releases || 0) >= 10 && !(S.festivalWins || []).length) {
      return {
        phase: "empire",
        phaseIdx: 5,
        message: "🏆 Push for 4★+ premieres to enter the festival circuit!",
        tab: "produce",
        cta: "Quality Push",
        action: { type: "tab", tab: "produce" },
      };
    }
    const phaseIdx = (S.releases || 0) >= 50 ? 5 : (S.releases || 0) >= 10 ? 4 : (S.releases || 0) >= 3 ? 3 : 2;
    return {
      phase: JOURNEY[phaseIdx].id,
      phaseIdx,
      message: "🎬 Keep greenlighting, upgrading staff, and climbing the industry ranks.",
      tab: "produce",
      cta: "Continue",
      action: { type: "tab", tab: "produce" },
    };
  }

  function buildHudShell() {
    if (document.getElementById("hud-shell")) return;
    const top = document.getElementById("top");
    if (!top) return;

    const shell = document.createElement("div");
    shell.id = "hud-shell";
    shell.innerHTML = `
      <div class="hud-row-top">
        <div class="hud-brand">
          <div class="hud-logo">🎬</div>
          <div class="hud-studio-info">
            <span class="hud-studio-name" id="hud-studio-name">Anime Studio</span>
            <span class="hud-dynasty-pill rank-d" id="hud-dynasty"><span id="hud-dynasty-grade">D</span> · <span id="hud-dynasty-score">0</span></span>
          </div>
        </div>
        <div class="hud-combo" id="hud-combo">🔥 <span id="hud-combo-n">0</span>x</div>
      </div>
      <div class="hud-resources" id="hud-resources"></div>
      <div class="hud-trend"><span class="spark">📈</span> Trending: <b id="hud-trend">Action</b></div>`;

    top.parentNode.insertBefore(shell, top);

    const res = document.getElementById("hud-resources");
    ["yen", "fans", "hype", "gems"].forEach((k) => {
      const el = top.querySelector(".res." + k);
      if (!el) return;
      el.classList.add("hud-res", k);
      const lbl = document.createElement("span");
      lbl.className = "hud-res-lbl";
      lbl.textContent = k;
      el.appendChild(lbl);
      res.appendChild(el);
    });

    const trend = top.querySelector("#trendbar");
    if (trend) trend.style.display = "none";
    top.classList.add("legacy-hidden");

    if (!document.getElementById("pathway-rail")) {
      const rail = document.createElement("div");
      rail.id = "pathway-rail";
      rail.innerHTML = `<div class="pathway-header">
          <span class="pathway-title">Director's Pathway</span>
          <button type="button" class="pathway-cta" id="pathway-cta">Continue</button>
        </div>
        <div class="pathway-steps" id="pathway-steps"></div>
        <div class="pathway-now" id="pathway-now"></div>`;
      const goal = document.getElementById("goal");
      goal.parentNode.insertBefore(rail, goal.nextSibling);
    }

    const tabs = document.getElementById("tabs");
    if (tabs && !document.getElementById("command-dock")) {
      const dock = document.createElement("div");
      dock.id = "command-dock";
      tabs.parentNode.insertBefore(dock, tabs);
      dock.appendChild(tabs);
    }

    document.documentElement.classList.add("premium-hud");

    document.getElementById("pathway-cta").addEventListener("click", () => {
      const hook = window.__AST_HOOK__;
      if (!hook) return;
      const pw = window.__AST_PATHWAY__;
      if (pw && pw.action && pw.action.type === "tab") {
        hook.getState().tab = pw.action.tab;
        hook.render();
        hook.play("click");
      }
    });
  }

  function updateHud(S, hook) {
    buildHudShell();
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set("hud-studio-name", S.studioName || "Your Studio");
    const score = dynastyScore(S);
    const dg = dynastyGrade(score);
    const pill = document.getElementById("hud-dynasty");
    if (pill) {
      pill.className = "hud-dynasty-pill " + dg.cls;
      set("hud-dynasty-grade", dg.g + "-RANK");
      set("hud-dynasty-score", score + "/100");
    }
    set("hud-trend", hook.trendGenre ? hook.trendGenre() : "Action");
    const trendEl = document.getElementById("trend");
    if (trendEl) trendEl.textContent = hook.trendGenre ? hook.trendGenre() : "Action";

    const combo = document.getElementById("hud-combo");
    const comboN = document.getElementById("hud-combo-n");
    if (combo && comboN) {
      if ((S.combo || 0) >= 2) {
        combo.classList.add("show");
        comboN.textContent = S.combo;
      } else combo.classList.remove("show");
    }

    const pw = analyzePathway(S, hook);
    window.__AST_PATHWAY__ = pw;

    const stepsEl = document.getElementById("pathway-steps");
    if (stepsEl) {
      stepsEl.innerHTML = JOURNEY.map((j, i) => {
        const cls = i < pw.phaseIdx ? "done" : i === pw.phaseIdx ? "current" : "";
        return `<div class="pathway-step ${cls}"><span class="ps-ic">${j.ic}</span><span class="ps-lbl">${j.lbl}</span></div>`;
      }).join("");
    }
    const nowEl = document.getElementById("pathway-now");
    if (nowEl) nowEl.textContent = pw.message;
    const cta = document.getElementById("pathway-cta");
    if (cta) {
      cta.textContent = pw.cta;
      cta.classList.toggle("urgent", !!pw.urgent);
    }
  }

  function updateTabBadges(S, hook) {
    const badges = {
      produce: readySlot(S, hook) >= 0,
      quests: claimableQuests(S) > 0,
      stars: false,
      store: false,
    };
    document.querySelectorAll(".tab").forEach((tab) => {
      const k = tab.dataset.tab;
      const existing = tab.querySelector(".tab-badge");
      if (existing) existing.remove();
      if (badges[k]) {
        const b = document.createElement("span");
        b.className = "tab-badge";
        tab.appendChild(b);
      }
    });
  }

  function install() {
    const hook = window.__AST_HOOK__;
    if (!hook || hook.__hudPremiumInstalled) return false;
    hook.__hudPremiumInstalled = true;

    buildHudShell();

    const origRender = hook.render;
    hook.render = function () {
      origRender();
      const S = hook.getState();
      updateHud(S, hook);
      updateTabBadges(S, hook);
    };

    const origUpdateTop = window.updateTopBar;
    if (typeof origUpdateTop === "function") {
      window.updateTopBar = function () {
        origUpdateTop();
        updateHud(hook.getState(), hook);
      };
    }

    hook.render();
    return true;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(buildHudShell, 0));
  } else buildHudShell();

  const poll = setInterval(() => {
    if (install()) clearInterval(poll);
  }, 60);
})();